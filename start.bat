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
rem Serve the source frontend (frontend-src/) like the Cloudflare deployment does.
rem It is rebuilt only when frontend-src/ changed. Set NORI_LEGACY_FRONTEND=1 to
rem serve the historical public/index.html entry instead.
set "NORI_FRONTEND_DIR="
if not "%NORI_LEGACY_FRONTEND%"=="1" if not defined NORI_PUBLIC_DIR (
    where node >nul 2>&1
    if errorlevel 1 (
        echo Node.js not found: serving the historical frontend from public\.
    ) else (
        for /f "delims=" %%D in ('node scripts\local\prepare_source_frontend.mjs --if-stale') do set "NORI_FRONTEND_DIR=%%D"
    )
)
if defined NORI_FRONTEND_DIR (
    set "NORI_PUBLIC_DIR=%NORI_FRONTEND_DIR%"
    echo Serving source frontend from %NORI_FRONTEND_DIR%
) else if not defined NORI_PUBLIC_DIR (
    echo Serving the historical frontend from public\.
)
cargo run --release -p nori-local --manifest-path rust\Cargo.toml
pause
