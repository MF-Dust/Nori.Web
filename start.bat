@echo off
setlocal
cd /d "%~dp0"
echo =======================================================
echo         Starting NoriOS local compatibility server
echo =======================================================
rem A packaged release ships Nori.Web.exe next to this script.
if exist "%~dp0Nori.Web.exe" (
    "%~dp0Nori.Web.exe"
    pause
    exit /b %errorlevel%
)
where cargo >nul 2>&1
if errorlevel 1 (
    echo Rust is required to run from source. Install it from https://rustup.rs
    echo or download a packaged Nori.Web release.
    pause
    exit /b 1
)
cargo run --release -p nori-local --manifest-path rust\Cargo.toml
pause
