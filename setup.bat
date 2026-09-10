@echo off
cd /d "%~dp0"
echo Installing Abu Kassar server dependencies...
npm install
if errorlevel 1 (
  echo npm install failed.
  pause
  exit /b 1
)
if not exist .env (
  copy .env.example .env >nul
  echo Created .env from .env.example. Edit .env with your MongoDB Atlas connection string.
)
echo Setup complete.
pause
