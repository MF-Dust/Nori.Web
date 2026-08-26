"""Root entrypoint forwarding to tests/test_cartridges.py."""

from tests.test_cartridges import (
    test_cakeduel,
    test_chat,
    test_chess,
    test_codenames,
    test_manifold,
    test_pictionary,
    test_registry,
)

if __name__ == "__main__":
    test_registry()
    test_chat()
    test_codenames()
    test_cakeduel()
    test_chess()
    test_pictionary()
    test_manifold()
    print("[ok] chat, codenames, cakeduel, chess, pictionary, manifold.web, and registry verified")
