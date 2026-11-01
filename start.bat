@echo off
setlocal
cd /d "%~dp0"
echo =======================================================
echo         Starting NoriOS local compatibility server
echo =======================================================
rem A packaged release ships Nori.Web.exe and the built frontend\ next to this script.
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
rem Build the source frontend (frontend-src\) when it changed. The server serves
rem it from .artifacts\build\app, layered over the static assets in public\.
if not defined NORI_FRONTEND_DIR (
    where node >nul 2>&1
    if errorlevel 1 (
        echo Node.js is required to build the frontend. Install it from https://nodejs.org
        echo or download a packaged Nori.Web release.
        pause
        exit /b 1
    )
    for /f "delims=" %%D in ('node scripts\local\prepare_source_frontend.mjs --if-stale') do set "NORI_FRONTEND_DIR=%%D"
)
if not defined NORI_FRONTEND_DIR (
    echo Building the source frontend failed.
    pause
    exit /b 1
)
echo Serving source frontend from %NORI_FRONTEND_DIR%
cargo run --release -p nori-local --manifest-path rust\Cargo.toml
pause
