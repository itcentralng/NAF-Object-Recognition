@echo off
:: Start the app
start /MIN "" python -m http.server 8000
start /MIN "" python main.py
timeout /t 5 /nobreak

:: Launch Edge in fullscreen kiosk mode
@REM start "" "msedge" --kiosk --edge-kiosk-type=fullscreen --no-first-run --disable-features=msEdgeEnterpriseModePolicies http://127.0.0.1:8000/index.html
start "" "msedge" --app=http://127.0.0.1:8000/index.html