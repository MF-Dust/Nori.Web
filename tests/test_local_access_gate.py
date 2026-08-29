from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SHIM = (ROOT / "public" / "nori-runtime-shims.js").read_text(encoding="utf-8")
AUTH = (ROOT / "backend" / "api" / "auth.py").read_text(encoding="utf-8")


def main() -> None:
    # The browser-side access gate is backed by the server's existing guest
    # semantics; keep the default guest path available on Cloudflare.
    assert 'os.getenv("NORI_AUTO_GUEST", "true")' in AUTH
    assert '"guest-user-001"' in AUTH

    # The shipped LoginPage uses an email field and native email validation.
    # The compatibility shim must turn only the access-gate field into text so
    # arbitrary non-empty input can reach the capture-phase submit handler.
    assert 'const ACCESS_FLAG = "nori.local.access.v1"' in SHIM
    assert 'input.type !== "text"' in SHIM
    assert 'input.placeholder = "输入任意字符即可接入"' in SHIM
    assert 'form.closest("#access-gate")' in SHIM
    assert 'const value = input.value.trim()' in SHIM
    assert 'if (!value) return' in SHIM

    # After the one-time gate action, only /api/auth/get-session is substituted
    # with the existing guest identity. No email/OTP request is fabricated.
    assert 'pathnameOf(value) === "/api/auth/get-session"' in SHIM
    assert 'sessionStorage.setItem(ACCESS_FLAG, "1")' in SHIM
    assert 'window.location.reload()' in SHIM
    assert 'guest-user-001' in SHIM
    assert '/api/auth/sign-in/email-otp' not in SHIM
    assert '/api/auth/email-otp/send-verification-otp' not in SHIM

    print("[ok] AlephPro access gate accepts any non-empty text as local guest access")


if __name__ == "__main__":
    main()
