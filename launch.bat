@echo off
cd /d "C:\PROJECTS\mail-triage"

:: Start the node server completely invisible/headless via VBScript
wscript.exe launch-headless.vbs

:: Wait 2 seconds for SQLite & server to bind port 3000
timeout /t 2 /nobreak >nul

:: Launch browser in dedicated app mode
start msedge --app=http://localhost:3000