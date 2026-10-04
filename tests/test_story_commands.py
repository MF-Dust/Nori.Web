"""Normal story RPC integration, including wrong answers and ending acknowledgement.

Scene completion notifications and client-owned compute snapshots are simulated;
this is not a pixel/audio parity test or a real-time browser playthrough.
"""
from __future__ import annotations

import asyncio
import json
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.services.story import advance
from backend.session.world import WorldSession


class Socket:
    def __init__(self):
        self.messages = []

    async def send_text(self, text):
        self.messages.append(json.loads(text))


class StoryCommandsTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.world = WorldSession("story-command-test", full_unlock=False)
        self.socket = Socket()
        advance(self.world)

    async def asyncTearDown(self):
        tasks = list(self.world._tasks)
        for task in tasks:
            task.cancel()
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    @property
    def facts(self):
        return self.world.cartridges["manifold.web"].state["facts"]

    async def rpc(self, command, **payload):
        response = await self.world.event_dispatcher.handle_event({
            "channel": "manifold.command.request", "requestId": "story-test",
            "payload": {"command": command, "payload": payload},
        })
        self.assertTrue(response["payload"]["ok"], response)
        return response["payload"]["result"]

    async def emit(self, fact):
        return await self.rpc("client.emitFact", factId=fact)

    async def artifacts(self, kind):
        response = await self.world.event_dispatcher.handle_event({
            "channel": "manifold.artifacts.request", "payload": {"artifactType": kind},
        })
        return response["payload"]["artifacts"]

    async def dispatch(self, cartridge, command, actor="player"):
        self.socket.messages.clear()
        await self.world.handle_client_message(self.socket, {
            "type": "dispatch", "cartridgeId": cartridge, "requestId": "story-test",
            "actor": actor, "expectedHeadVersion": self.world.cartridges[cartridge].head_version,
            "cmd": command,
        })
        ack = next(m for m in self.socket.messages if m.get("requestId") == "story-test")
        self.assertNotIn("error", ack, ack)
        return ack

    async def test_vaults_are_surfaced_and_wrong_answers_do_not_advance(self):
        self.assertEqual(await self.artifacts("app"), [])
        await self.emit("paper.downloaded")
        vault = (await self.artifacts("app"))[0]["data"]
        self.assertEqual(vault["app_kind"], "password_prompt")
        self.assertEqual(vault["puzzle_id"], "bookcipher")
        self.assertFalse((await self.rpc(vault["command"], puzzleId=vault["puzzle_id"], tokens=["wrong"]))["ok"])
        self.assertNotIn("bookcipher.solved", self.facts)
        self.assertNotIn("file.recovery_keys", {a["id"] for a in await self.artifacts("file")})
        self.assertTrue((await self.rpc(vault["command"], puzzleId=vault["puzzle_id"], tokens=["Eurydice"]))["ok"])
        self.assertIn("file.recovery_keys", {a["id"] for a in await self.artifacts("file")})
        await self.emit("cult.zip.downloaded")
        self.assertFalse((await self.rpc("vault.unlock", puzzleId="cult", tokens=["978209"]))["ok"])
        self.assertNotIn("cult.unpacked", self.facts)
        self.assertTrue((await self.rpc("vault.unlock", puzzleId="cult", tokens=["978208"]))["ok"])

    async def test_idle_command_and_event_share_recovery_and_reject_bad_numbers(self):
        result = await self.rpc("idle.sync", maxCompute=1e8, maxComputeThisRun=1e8, cap=1e8, type="idle.complete")
        self.assertTrue(result["ok"])
        self.assertNotIn("idle.manifold_complete", self.facts)
        self.assertIn("recover.seal_config", self.facts)
        self.assertIn("compute.cap_hit", self.facts)
        await self.rpc("idle.sync", maxCompute=1)
        self.assertEqual(self.world.cartridges["manifold.web"].state["variables"]["idle"]["maxCompute"], 1e8)
        result = await self.rpc("idle.sync", maxCompute=-1)
        self.assertFalse(result["ok"])
        response = await self.world.event_dispatcher.handle_event({
            "channel": "idle.sync", "payload": {"prestige": {"maxCompute": 1e12}},
        })
        self.assertTrue(response["payload"]["ok"])
        self.assertIn("recover.paper_draft", self.facts)

    async def test_daniel_evidence_waits_for_all_answers(self):
        await self.emit("signal_daniel.unlocked")
        await self.emit("qfr.installed")
        self.assertIn("daniel.deadman.delivered", self.facts)
        self.assertNotIn("signal.daniel.file", {a["id"] for a in await self.artifacts("signal_message")})
        self.assertTrue((await self.rpc("signal.daniel.verify"))["reply"])
        self.assertFalse((await self.rpc("signal.daniel.verify", answer="314159"))["ok"])
        self.assertEqual(self.world.cartridges["manifold.web"].state["variables"].get("danielVerifyStep", 0), 0)
        for answer in ("2-13", "3月6日"):
            self.assertTrue((await self.rpc("signal.daniel.verify", answer=answer))["ok"])
            self.assertNotIn("daniel.evidence_unlocked", self.facts)
        self.assertTrue((await self.rpc("signal.daniel.verify", answer="银虎斑"))["ok"])
        self.assertIn("signal.daniel.file", {a["id"] for a in await self.artifacts("signal_message")})

    async def test_nas_download_publishes_the_actual_file_and_rejects_unknown_paths(self):
        self.assertFalse((await self.rpc("nas.list", path="/"))["ok"])
        self.assertFalse((await self.rpc("nas.connect", host="unknown.example"))["ok"])
        self.assertTrue((await self.rpc("nas.connect", host="198.51.100.74"))["ok"])
        self.assertIn("nas.connected", self.facts)
        names = {e["name"] for e in (await self.rpc("nas.list", path="/"))["entries"]}
        self.assertIn("deep-dive-consent-review.pdf", names)
        self.assertTrue((await self.rpc("nas.read", path="/README.txt"))["text"])
        self.assertFalse((await self.rpc("nas.download", path="/missing.pdf"))["ok"])
        self.assertNotIn("download.hanyue_consent", self.facts)
        result = await self.rpc("nas.download", path="/deep-dive-consent-review.pdf")
        self.assertEqual(result["downloadFact"], "download.hanyue_consent")
        self.assertIn("file.hanyue_consent", {a["id"] for a in await self.artifacts("file")})
        self.assertTrue((await self.rpc("nas.download", path="/deep-dive-consent-review.pdf"))["already"])

    async def test_normal_commands_reach_the_ending_not_just_ending_started(self):
        await self.emit("boot.completed")
        await self.world._mount("chess")
        await self.dispatch("chess", {"type": "startGame", "mode": "normal", "side": "white", "difficulty": "casual"})
        await self.dispatch("chess", {"type": "resign"})
        self.assertIn("mail.help.unlocked", self.facts)
        await self.rpc("mail.read", mailId="mail.help")
        await self.emit("system.repaired")  # source repair-controller notification
        await self.emit("paper.downloaded")  # shipped browser download
        await self.rpc("vault.unlock", puzzleId="bookcipher", tokens=["欧律狄刻"])
        recovery = next(a for a in await self.artifacts("file") if a["id"] == "file.recovery_keys")
        code = re.search(r"[A-Z0-9]{4}(?:-[A-Z0-9]{4}){3}", recovery["data"]["body_md"]).group()
        password = (await self.rpc("signal.recover", recoveryCode=code))["tempPassword"]
        await self.rpc("signal.login", username="me@manifold.institute", password=password)
        for n in (1, 2, 3):
            await self.emit(f"corrupt.doc{n}.read")  # source document-focus notifications
        await self.emit("corrupt.climax_pending")
        self.assertIn("corrupt.armed", self.facts)
        await self.emit("virus.cleared")  # antivirus scene acknowledgement
        await self.rpc("mail.read", mailId="mail.act2_hinge")
        for fact in ("qfr.downloaded", "qfr.installing", "qfr.installed"):
            await self.emit(fact)
        await self.rpc("idle.sync", maxCompute=1e8, maxComputeThisRun=1e8, cap=1e10)
        await self.emit("file.seal_config.read")
        await self.emit("file.tower_photo.read")
        self.assertNotIn("arg.seal_released", self.facts)
        await self.dispatch("chat", {"type": "playerMessage", "text": "pharos"})
        self.assertIn("arg.seal_released", self.facts)
        await self.rpc("signal.daniel.verify")
        for answer in ("02-13", "03-06", "silver tabby"):
            await self.rpc("signal.daniel.verify", answer=answer)
        await self.emit("daniel.retraction.downloaded")
        await self.rpc("nas.connect", host="198.51.100.74")
        await self.rpc("nas.download", path="/deep-dive-consent-review.pdf")
        await self.emit("futurum.doc2.downloaded")
        await self.emit("cult.zip.downloaded")
        await self.rpc("vault.unlock", puzzleId="cult", tokens=["978208"])
        await self.emit("arg.cult_truth")  # cult scene acknowledgement
        await self.rpc("bounty.installExtension")
        for url in ("https://pulse.social/user/frank_mercer48", "https://pulse.social/user/mags_cole"):
            response = await self.world.event_dispatcher.handle_event({"channel": "manifold.bounty.submit", "payload": {"url": url}})
            self.assertTrue(response["payload"]["ok"])
        self.assertIn("arg.honeypot_access", self.facts)
        # Finish the other three games using their ordinary reducers, not state injection.
        await self.world._mount("codenames")
        await self.dispatch("codenames", {"type": "startGame"})
        await self.dispatch("codenames", {"type": "submitClue", "clue": {"word": "示例线索", "count": 1}})
        game = self.world.cartridges["codenames"].state["gameState"]
        cell = game["key"][game["history"][-1]["clueGiver"]].index("ASSASSIN")
        await self.dispatch("codenames", {"type": "submitGuess", "cell": cell}, "agent")
        await self.world._mount("pictionary")
        await self.dispatch("pictionary", {"type": "startSession", "atMs": 0})
        await self.dispatch("pictionary", {"type": "forceEndSession", "atMs": 60_000})
        await self.world._mount("cakeduel")
        await self.dispatch("cakeduel", {"type": "startGame"})
        for _ in range(10):
            cake = self.world.cartridges["cakeduel"]
            if cake.state["game"]["gameEnded"]:
                break
            actor = "player" if cake._phasing_player(cake.state["game"]) == 0 else "agent"
            await self.dispatch("cakeduel", {"type": "play", "action": {"type": "concede"}}, actor)
        self.assertIn("arg.gestures_complete", self.facts)
        await self.rpc("idle.sync", maxCompute=1e31, maxComputeThisRun=1e31, cap=1e35)
        self.assertIn("recover.trainlog", self.facts)
        await self.emit("arg.memory.start")  # opening the restored training archive
        await self.emit("arg.memory.shown")
        self.assertIn("act3.paradigm_reveal.due", self.facts)
        self.assertNotIn("recover.datasea_exe", self.facts)
        self.assertFalse((await self.rpc("idle.complete"))["ok"])
        await self.emit("arg.manifold_unlocked")  # source equilibrium-selection producer
        await self.rpc("idle.sync", claimedMementoCount=12)
        self.assertFalse((await self.rpc("idle.complete"))["ok"])
        await self.rpc("idle.sync", claimedMementoCount=13)
        self.assertTrue((await self.rpc("idle.complete"))["ok"])
        self.assertIn("recover.datasea_exe", self.facts)
        for fact in ("arg.finale.started", "arg.finale.shown", "arg.farewell.shown", "arg.ending.shown"):
            await self.emit(fact)
        self.assertIn("arg.farewell.started", self.facts)
        self.assertIn("arg.ending.started", self.facts)
        self.assertIn("arg.ending.shown", self.facts)
        self.assertIn("mail.nori_final.unlocked", self.facts)

    async def test_internal_game_completion_publishes_help_without_another_player_action(self):
        await self.world._mount("chess")
        await self.dispatch("chess", {"type": "startGame", "mode": "normal", "side": "white", "difficulty": "casual"})
        await self.world._dispatch_internal("chess", "agent", {"type": "resign"})
        self.assertIn("mail.help.unlocked", self.facts)


if __name__ == "__main__":
    unittest.main()
