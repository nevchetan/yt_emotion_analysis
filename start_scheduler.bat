@echo off
echo Starting Email Scheduler...
echo.
echo This will check for scheduled emails every minute.
echo Press Ctrl+C to stop.
echo.
node lib/scheduler.js
