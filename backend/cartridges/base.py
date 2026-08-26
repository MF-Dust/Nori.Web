"""Shared replicated-runtime primitives.

The public NoriOS client applies RFC 6902 patches from `runtime_transition`
messages.  This module deliberately models that public contract rather than
inventing a parallel state-sync format.
"""

from __future__ import annotations

import copy
from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, List, Optional

Json = Any


class CommandRejected(ValueError):
    """A valid protocol command that the current cartridge state rejects."""


@dataclass(slots=True)
class ReducerResult:
    state: Dict[str, Json]
    result: Json = None
    events: List[Dict[str, Json]] = field(default_factory=list)


@dataclass(slots=True)
class Commit:
    committed: bool
    version: int
    transition: Optional[Dict[str, Json]]
    result: Json


def _clone(value: Json) -> Json:
    return copy.deepcopy(value)


def _escape_pointer_token(token: str) -> str:
    return token.replace("~", "~0").replace("/", "~1")


def top_level_patch(before: Dict[str, Json], after: Dict[str, Json]) -> List[Dict[str, Json]]:
    """Build stable RFC 6902 patches without mutating either document.

    Every shipped cartridge has a small top-level state object. Replacing a
    changed top-level branch is intentionally conservative and much less
    brittle than hand-writing patches for every nested game transition.
    """

    patches: List[Dict[str, Json]] = []
    before_keys = set(before)
    after_keys = set(after)

    for key in sorted(before_keys - after_keys):
        patches.append({"op": "remove", "path": f"/{_escape_pointer_token(key)}"})
    for key in sorted(after_keys - before_keys):
        patches.append(
            {
                "op": "add",
                "path": f"/{_escape_pointer_token(key)}",
                "value": _clone(after[key]),
            }
        )
    for key in sorted(before_keys & after_keys):
        if before[key] != after[key]:
            patches.append(
                {
                    "op": "replace",
                    "path": f"/{_escape_pointer_token(key)}",
                    "value": _clone(after[key]),
                }
            )
    return patches


class BaseCartridge:
    """Versioned, JSON-patch replicated cartridge state.

    Subclasses implement :meth:`reduce` and return an entire next state. This
    class adds the wire-level actor/cmd/patch/event envelope expected by the
    verified public Arcade client.
    """

    cartridge_id: str

    def __init__(self, cartridge_id: str, initial_state: Optional[Dict[str, Json]] = None):
        self.cartridge_id = cartridge_id
        self.initial_state: Dict[str, Json] = _clone(initial_state or {})
        self.state: Dict[str, Json] = _clone(self.initial_state)
        self.head_version = 0
        self.visible_version = 0
        self.transitions: Dict[int, Dict[str, Json]] = {}

    def reset(self) -> None:
        self.state = _clone(self.initial_state)
        self.head_version = 0
        self.visible_version = 0
        self.transitions.clear()

    def get_snapshot(self, visibility_fence_id: str = "ui") -> Dict[str, Json]:
        return {
            "visibilityFenceId": visibility_fence_id,
            "headVersion": self.head_version,
            "visibleVersion": self.visible_version,
            "state": _clone(self.state),
        }

    def normalize_events(
        self, events: Iterable[Dict[str, Json]], version: int
    ) -> List[Dict[str, Json]]:
        normalized: List[Dict[str, Json]] = []
        for index, raw_event in enumerate(events):
            event = _clone(raw_event)
            if not isinstance(event.get("type"), str) or not event["type"]:
                raise ValueError(f"{self.cartridge_id}: transition event requires a type")
            event["version"] = version
            event["index"] = index
            normalized.append(event)
        return normalized

    def commit(self, actor: str, cmd: Dict[str, Json], reduced: ReducerResult) -> Commit:
        next_state = _clone(reduced.state)
        patches = top_level_patch(self.state, next_state)
        if not patches and not reduced.events:
            return Commit(False, self.head_version, None, _clone(reduced.result))

        version = self.head_version + 1
        events = self.normalize_events(reduced.events, version)
        transition = {
            "actor": actor,
            "cmd": _clone(cmd),
            "patches": patches,
            "events": events,
        }
        self.state = next_state
        self.head_version = version
        self.visible_version = version
        self.transitions[version] = _clone(transition)
        return Commit(True, version, transition, _clone(reduced.result))

    def reduce(self, actor: str, cmd: Dict[str, Json]) -> ReducerResult:
        raise NotImplementedError

    def dispatch(self, actor: str, cmd: Dict[str, Json]) -> Commit:
        if not isinstance(actor, str) or not actor:
            raise CommandRejected("actor is required")
        if not isinstance(cmd, dict) or not isinstance(cmd.get("type"), str):
            raise CommandRejected("cmd.type is required")
        return self.commit(actor, cmd, self.reduce(actor, cmd))
