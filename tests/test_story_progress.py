"""Fresh-world story progression reaches the ending without the archive snapshot."""

from backend.cartridges.manifold import ManifoldWebCartridge
from backend.services.story import advance, player_text, present_artifacts, recovery_password
from backend.session.world import WorldSession
from backend.virtual_apps.files import get_file_artifacts
from backend.virtual_apps.mail import get_mail_artifacts


def _facts(world: WorldSession):
    return world.cartridges["manifold.web"].state["facts"]


def _emit(world: WorldSession, fact_id: str) -> None:
    world.cartridges["manifold.web"].dispatch(
        "player",
        {"type": "client.emitFact", "factId": fact_id},
    )
    advance(world)


def test_fresh_world_starts_at_boot() -> None:
    world = WorldSession("story", full_unlock=False)
    advance(world)
    facts = _facts(world)
    assert "session.ready" in facts
    assert "boot.completed" not in facts
    assert "arg.ending.shown" not in facts


def test_archive_world_is_not_rewritten() -> None:
    world = WorldSession("archive", full_unlock=True)
    before = set(_facts(world))
    assert advance(world) == []
    assert set(_facts(world)) == before
    assert "arg.ending.shown" in before


def test_boot_unlocks_only_the_first_mail() -> None:
    world = WorldSession("story", full_unlock=False)
    advance(world)
    _emit(world, "boot.completed")
    facts = _facts(world)
    assert "mail.advisory.unlocked" in facts
    assert "mail.nori_final.unlocked" not in facts
    ids = {item["id"] for item in present_artifacts(get_mail_artifacts(), facts)}
    assert "mail.advisory" in ids
    assert "mail.acq_strategic" in ids
    assert "mail.help" not in ids
    assert "mail.nori_final" not in ids


def test_game_completion_unlocks_help_mail() -> None:
    world = WorldSession("story", full_unlock=False)
    from backend.cartridges.registry import CARTRIDGE_REGISTRY
    world.cartridges["chess"] = CARTRIDGE_REGISTRY.create("chess")
    world.cartridges["chess"].state["gameState"] = {"status": "checkmate"}
    advance(world)
    facts = _facts(world)
    assert "gesture.chess" in facts
    assert "game.any.completed" in facts
    assert "mail.help.unlocked" in facts


def test_chain_reaches_ending() -> None:
    world = WorldSession("story", full_unlock=False)
    advance(world)
    for fact_id in (
        "boot.completed",
        "corrupt.climax_pending",
        "virus.cleared",
        "mail.act2_hinge.read",
        "file.seal_config.read",
        "file.tower_photo.read",
        "arg.cult_truth",
        "arg.honeypot_access",
        "mail.log_encounter.read",
        "qfr.installed",
        "arg.memory.shown",
        "arg.manifold_unlocked",
        "idle.manifold_complete",
        "arg.finale.shown",
        "arg.farewell.shown",
        "arg.ending.shown",
    ):
        _emit(world, fact_id)
        if fact_id == "file.seal_config.read":
            player_text(world, "pharos")
            advance(world)
    facts = _facts(world)
    assert "corrupt.armed" in facts
    assert "arg.seal_released" in facts
    assert "daniel.deadman.delivered" in facts
    assert "recover.datasea_exe" in facts
    assert "arg.farewell.started" in facts
    assert "arg.ending.started" in facts
    assert "arg.ending.shown" in facts
    assert "mail.nori_final.unlocked" in facts


def test_compute_recovers_only_reached_files() -> None:
    world = WorldSession("story", full_unlock=False)
    world.cartridges["manifold.web"].state["variables"]["idle"] = {"maxCompute": 1e8}
    advance(world)
    facts = _facts(world)
    assert "recover.seal_config" in facts
    assert "recover.trainlog" not in facts
    locked = [
        item for item in present_artifacts(get_file_artifacts(), facts)
        if (item.get("data") or {}).get("recover_when") == "recover.trainlog"
    ]
    assert locked
    assert "body_md" not in locked[0]["data"]
    assert "trainlog" not in locked[0]["data"]


def test_signal_recovery_uses_the_archived_code() -> None:
    assert recovery_password("7K4P-2WQ9-6ZTM-1XAH")
    assert recovery_password("nope") is None


def test_idle_complete_records_manifold_fact() -> None:
    cartridge = ManifoldWebCartridge(full_unlock=False)
    cartridge.dispatch("player", {"type": "idle.complete"})
    assert "idle.manifold_complete" in cartridge.state["facts"]
