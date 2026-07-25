@echo off
REM Restart all SarthakSetu services.
call "%~dp0stop.bat"
call "%~dp0start.bat"
