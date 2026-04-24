@echo off
echo Deleting old automation profile...
rmdir /s /q ".chrome-automation" 2>nul
echo Done. Run node script.js to start the automation.
pause