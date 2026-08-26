"""Public `chat` cartridge contract ported from the shipped client reducer."""

from __future__ import annotations

import asyncio
import re
import time
import uuid
from copy import deepcopy
from typing import Any, Dict, List, Tuple

from .base import BaseCartridge, CommandRejected, ReducerResult
from ..services.llm_service import EMOTION_ALIASES, EMOTIONS, LLM_SERVICE


class ChatCartridge(BaseCartridge):
    def __init__(self) -> None:
        super().__init__(
            "chat",
            {
                "operations": {},
                "nextMessageId": 1,
                "turn": self._idle_turn(),
                "presentationMode": "audio",
            },
        )

    @staticmethod
    def _idle_turn() -> Dict[str, Any]:
        return {"operationId": None, "phase": "idle", "outcome": None}

    @staticmethod
    def _new_operation(actor: str) -> Dict[str, Any]:
        return {
            "revealedThrough": -1,
            "startedThrough": -1,
            "presentedThrough": -1,
            "lastRevealedBlockIsSpeech": False,
            "pendingBlocks": {},
            "pendingStarted": {},
            "pendingPresented": {},
            "ingestingActor": actor,
        }

    @staticmethod
    def _append_lines(state: Dict[str, Any], events: List[Dict[str, Any]]) -> None:
        if not events:
            return
        lines = list(state.get("lines", []))
        for event in events:
            event_type = event.get("type")
            if event_type not in {"player_message", "agent_message"}:
                continue
            line = {key: deepcopy(value) for key, value in event.items() if key != "type"}
            line["sender"] = "player" if event_type == "player_message" else "agent"
            lines.append(line)
        # Matches the shipped reducer's 150-line rolling window.
        if len(lines) >= 200:
            lines = lines[50:]
        state["lines"] = lines

    @staticmethod
    def _advance_contiguous(current: int, target: int, pending: Dict[str, Any]) -> int:
        if target <= current:
            return current
        pending[str(target)] = True
        while pending.get(str(current + 1)):
            pending.pop(str(current + 1), None)
            current += 1
        return current

    @classmethod
    def _flush_presented(cls, operation: Dict[str, Any]) -> None:
        while (
            operation["pendingPresented"].get(str(operation["presentedThrough"] + 1))
            and operation["presentedThrough"] + 1 <= operation["startedThrough"]
        ):
            next_block = operation["presentedThrough"] + 1
            operation["pendingPresented"].pop(str(next_block), None)
            operation["presentedThrough"] = next_block

    @classmethod
    def _reveal_available(
        cls, state: Dict[str, Any], operation_id: str, operation: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        events: List[Dict[str, Any]] = []
        mode = state.get("presentationMode", "audio")
        while operation.get("cutBlockId") is None or operation["revealedThrough"] < operation["cutBlockId"]:
            block_id = operation["revealedThrough"] + 1
            block = operation["pendingBlocks"].get(str(block_id))
            if block is None:
                break
            is_speech = bool(block["isSpeech"])
            if is_speech and mode == "audio" and operation["startedThrough"] < block_id:
                break
            if is_speech and mode == "text" and operation["startedThrough"] < block_id:
                operation["startedThrough"] = block_id
            operation["pendingBlocks"].pop(str(block_id), None)
            operation["revealedThrough"] = block_id
            operation["lastRevealedBlockIsSpeech"] = is_speech
            event: Dict[str, Any] = {
                "type": "player_message" if operation.get("ingestingActor") == "player" else "agent_message",
                "messageId": block["messageId"],
                "blockId": block_id,
                "content": block["content"],
                "createdAt": int(time.time() * 1000),
                "isSpeech": is_speech,
                "blockType": block["blockType"],
            }
            if block.get("emotion"):
                event["emotion"] = block["emotion"]
            events.append(event)
            if not is_speech or mode == "text":
                operation["presentedThrough"] = max(operation["presentedThrough"], block_id)
            if not is_speech:
                operation["startedThrough"] = cls._advance_contiguous(
                    operation["startedThrough"], block_id, operation["pendingStarted"]
                )
        return events

    @staticmethod
    def sanitize_player_text(text: Any) -> str:
        if not isinstance(text, str):
            raise CommandRejected("text must be a string")
        normalized = re.sub(r"[\r\n\x00-\x1f\x7f\u2028\u2029]", " ", text)
        normalized = re.sub(r"\s+", " ", normalized).strip()
        if not normalized or len(normalized) > 100:
            raise CommandRejected("player text must be sanitized and at most 100 characters")
        return normalized

    def reduce(self, actor: str, cmd: Dict[str, Any]) -> ReducerResult:
        command_type = cmd["type"]
        state = deepcopy(self.state)

        if command_type == "playerMessage":
            if actor != "player":
                raise CommandRejected("Only player may send playerMessage")
            text = self.sanitize_player_text(cmd.get("text"))
            message_id = f"msg_{state['nextMessageId']}"
            event = {
                "type": "player_message",
                "messageId": message_id,
                "content": text,
                "createdAt": int(time.time() * 1000),
            }
            state["nextMessageId"] += 1
            self._append_lines(state, [event])
            return ReducerResult(state, {"messageId": message_id}, [event])

        if command_type == "agentMessage":
            if actor != "agent":
                raise CommandRejected("Only agent may send agentMessage")
            text = cmd.get("text")
            if not isinstance(text, str):
                raise CommandRejected("text must be a string")
            message_id = f"msg_{state['nextMessageId']}"
            event = {
                "type": "agent_message",
                "messageId": message_id,
                "content": text,
                "createdAt": int(time.time() * 1000),
            }
            state["nextMessageId"] += 1
            self._append_lines(state, [event])
            return ReducerResult(state, {"messageId": message_id}, [event])

        if command_type == "setPresentationMode":
            mode = cmd.get("presentationMode")
            if mode not in {"audio", "text"}:
                raise CommandRejected("presentationMode must be audio or text")
            if state["presentationMode"] == mode:
                return ReducerResult(state, {"presentationMode": mode})
            state["presentationMode"] = mode
            revealed_events: List[Dict[str, Any]] = []
            if mode == "text":
                for operation_id, operation in state["operations"].items():
                    operation["pendingStarted"] = {}
                    operation["pendingPresented"] = {}
                    operation["startedThrough"] = max(operation["startedThrough"], operation["presentedThrough"])
                    operation["presentedThrough"] = max(operation["presentedThrough"], operation["startedThrough"])
                    revealed_events.extend(self._reveal_available(state, operation_id, operation))
            self._append_lines(state, revealed_events)
            return ReducerResult(state, {"presentationMode": mode}, revealed_events)

        if command_type == "ingestBlock":
            operation_id = cmd.get("operationId")
            message_id = cmd.get("messageId")
            block_id = cmd.get("blockId")
            content = cmd.get("content")
            block_type = cmd.get("blockType")
            is_speech = cmd.get("isSpeech")
            if (
                not isinstance(operation_id, str)
                or not isinstance(message_id, str)
                or isinstance(block_id, bool)
                or not isinstance(block_id, int)
                or block_id < 0
                or not isinstance(content, str)
                or not isinstance(block_type, str)
                or not isinstance(is_speech, bool)
            ):
                raise CommandRejected("Invalid ingestBlock payload")
            emotion = cmd.get("emotion")
            if emotion is not None and emotion not in EMOTIONS:
                raise CommandRejected("Invalid emotion")
            operation = state["operations"].get(operation_id)
            if operation is None:
                operation = self._new_operation(actor)
                state["operations"][operation_id] = operation
            if operation.get("cutBlockId") is not None and block_id > operation["cutBlockId"]:
                return ReducerResult(state, {"revealedBlockIds": []})
            if block_id > operation["revealedThrough"] and str(block_id) not in operation["pendingBlocks"]:
                block: Dict[str, Any] = {
                    "messageId": message_id,
                    "blockId": block_id,
                    "blockType": block_type,
                    "content": content,
                    "isSpeech": is_speech,
                }
                if emotion is not None:
                    block["emotion"] = emotion
                operation["pendingBlocks"][str(block_id)] = block
            events = self._reveal_available(state, operation_id, operation)
            self._append_lines(state, events)
            return ReducerResult(
                state,
                {"revealedBlockIds": [event["blockId"] for event in events]},
                events,
            )

        if command_type in {"audioStarted", "audioDone"}:
            operation_id = cmd.get("operationId")
            block_id = cmd.get("blockId")
            if not isinstance(operation_id, str) or isinstance(block_id, bool) or not isinstance(block_id, int):
                raise CommandRejected(f"Invalid {command_type} payload")
            operation = state["operations"].get(operation_id)
            if operation is None:
                return ReducerResult(state, {"startedThrough" if command_type == "audioStarted" else "presentedThrough": -1})
            if operation.get("cutBlockId") is not None and block_id > operation["cutBlockId"]:
                key = "startedThrough" if command_type == "audioStarted" else "presentedThrough"
                return ReducerResult(state, {key: operation[key]})
            operation["startedThrough"] = self._advance_contiguous(
                operation["startedThrough"], block_id, operation["pendingStarted"]
            )
            self._flush_presented(operation)
            events: List[Dict[str, Any]] = []
            if command_type == "audioDone" and block_id > operation["presentedThrough"]:
                operation["pendingPresented"][str(block_id)] = True
                self._flush_presented(operation)
            events.extend(self._reveal_available(state, operation_id, operation))
            self._append_lines(state, events)
            key = "startedThrough" if command_type == "audioStarted" else "presentedThrough"
            return ReducerResult(state, {key: operation[key]}, events)

        if command_type == "operationStarted":
            operation_id = cmd.get("operationId")
            if not isinstance(operation_id, str):
                raise CommandRejected("operationId is required")
            state["turn"] = {"operationId": operation_id, "phase": "executing", "outcome": None}
            return ReducerResult(state, {"turn": deepcopy(state["turn"])})

        if command_type == "operationCompleted":
            operation_id = cmd.get("operationId")
            outcome = cmd.get("outcome")
            if not isinstance(operation_id, str) or outcome not in {"completed", "partial", "aborted", "error"}:
                raise CommandRejected("Invalid operationCompleted payload")
            if state["turn"].get("operationId") in {None, operation_id}:
                state["turn"] = {"operationId": operation_id, "phase": "presenting", "outcome": outcome}
            return ReducerResult(state, {"turn": deepcopy(state["turn"])})

        if command_type == "operationSettled":
            operation_id = cmd.get("operationId")
            outcome = cmd.get("outcome")
            if not isinstance(operation_id, str) or outcome not in {"completed", "partial", "aborted", "error"}:
                raise CommandRejected("Invalid operationSettled payload")
            if state["turn"].get("operationId") in {None, operation_id}:
                state["turn"] = self._idle_turn()
            return ReducerResult(state, {"turn": deepcopy(state["turn"])})

        if command_type == "applyCut":
            operation_id = cmd.get("operationId")
            proposed_cut = cmd.get("proposedCut")
            if not isinstance(operation_id, str) or isinstance(proposed_cut, bool) or not isinstance(proposed_cut, int):
                raise CommandRejected("Invalid applyCut payload")
            operation = state["operations"].get(operation_id)
            if operation is None and state["turn"].get("operationId") != operation_id:
                return ReducerResult(state, {"cutBlockId": proposed_cut})
            if operation is None:
                operation = self._new_operation(actor)
                state["operations"][operation_id] = operation
            existing = operation.get("cutBlockId")
            operation["cutBlockId"] = min(existing, proposed_cut) if isinstance(existing, int) else proposed_cut
            for key in list(operation["pendingBlocks"]):
                if int(key) > operation["cutBlockId"]:
                    operation["pendingBlocks"].pop(key, None)
            return ReducerResult(state, {"cutBlockId": operation["cutBlockId"]})

        raise CommandRejected(f"Unknown chat command: {command_type}")

    @staticmethod
    def _extract_emotion(text: str) -> Tuple[str, str]:
        return LLM_SERVICE.extract_emotion(text)

    async def generate_reply(self, user_text: str) -> Tuple[str, str]:
        """Use an optional OpenAI-compatible model; retain a local fallback."""
        history = []
        for line in self.state.get("lines", [])[-12:]:
            if not isinstance(line, dict):
                continue
            content = line.get("content")
            if not isinstance(content, str):
                continue
            history.append(
                {
                    "role": "assistant" if line.get("sender") == "agent" else "user",
                    "content": content,
                }
            )
        return await LLM_SERVICE.generate_reply(user_text, history)

    @staticmethod
    def build_agent_turn(reply: str, emotion: str) -> Tuple[str, str, List[Dict[str, Any]]]:
        operation_id = str(uuid.uuid4())
        message_id = str(uuid.uuid4())
        commands = [
            {"type": "operationStarted", "operationId": operation_id},
            {
                "type": "ingestBlock",
                "operationId": operation_id,
                "messageId": message_id,
                "blockId": 0,
                "blockType": "text",
                "content": reply,
                "isSpeech": True,
                "emotion": emotion if emotion in EMOTIONS else "neutral",
            },
            {"type": "operationCompleted", "operationId": operation_id, "outcome": "completed"},
        ]
        return operation_id, message_id, commands
