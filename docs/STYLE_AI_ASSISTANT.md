# Style AI Assistant Setup

This module adds image-based style suggestions using a local Python backend.
It now supports two modes:

- `heuristic`: lightweight local color/style engine (default fallback)
- `vlm`: open-source vision-language captioning (BLIP), then style logic on top

## 1. Backend Setup

From project root:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r ai_backend/requirements.txt
uvicorn ai_backend.app:app --reload --host 0.0.0.0 --port 8000
```

If your shell is PowerShell, activate with:

```powershell
.venv\Scripts\Activate.ps1
```

If your shell is Command Prompt, activate with:

```cmd
.venv\Scripts\activate.bat
```

### Optional VLM mode

Install optional VLM dependencies:

```bash
pip install -r ai_backend/requirements-vlm.txt
```

Optional environment variable to change model:

```bash
set STYLE_AI_VLM_MODEL=Salesforce/blip-image-captioning-base
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

Model status check:

```bash
curl http://127.0.0.1:8000/model-status
```

## 2. App Usage

1. Open the app and go to `Style AI` tab.
2. Set backend URL:
   - Android emulator: `http://10.0.2.2:8000`
   - iOS simulator: `http://127.0.0.1:8000`
   - Physical phone: `http://<your-computer-lan-ip>:8000`
3. Choose an image.
4. Select mode:
   - `AUTO`: try VLM, fallback to heuristic
   - `VLM`: force open-source VLM attempt
   - `HEURISTIC`: skip VLM entirely
5. Tap `Analyze Style`.

## 3. API Response

`POST /analyze-style` returns:

- `caption`
- `style_direction`
- `dominant_colors[]` with `hex`, `name`, `percentage`
- `color_palette_advice[]`
- `outfit_ideas[]`
- `model`
- `mode_requested`
- `fallback_reason`

## Notes

- No paid APIs are required.
- If VLM dependencies are missing or model loading fails, backend gracefully falls back to heuristic mode.

## Troubleshooting: Android Phone "Network request failed"

If your Android phone shows `Analysis failed: Network request failed`, use this checklist:

1. In app `Backend URL`, do not use `127.0.0.1` or `10.0.2.2` on a physical phone.
2. Use your computer LAN IP, for example `http://192.168.1.12:8000`.
3. Keep backend running with:

```bash
uvicorn ai_backend.app:app --reload --host 0.0.0.0 --port 8000
```

4. Make sure phone and computer are on the same Wi-Fi.
5. Allow Python/Uvicorn through Windows Firewall (Private network).
6. Verify from computer:

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/model-status
```

7. In the app, tap `Test Backend Connection` to validate reachability before image analysis.
