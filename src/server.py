#!/usr/bin/env python3
"""
Start with:
    pip install flask flask_cors   # tiny deps
    python server.py
Browse to http://127.0.0.1:5000
"""
from pathlib import Path
import threading

from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS          # lets you open the page straight from a file:// URL
from main import RealTimeQuranASR     # your long file
# ---------------------------------------------------------------------------

JSON_PATH    = "uthmani.json"
MODEL_PATH   = "OdyAsh/faster-whisper-base-ar-quran"
AUDIO_PATH   = Path("/home/upgrade/Android/Quran/Surah_Taha_Jamal_AbdiNasir_QUALITY_QALOON_Taraweeh_Recitation_Masjid_al_Humera_رواية_قالون_سورة_طه.mp3")

app = Flask(__name__, static_folder="static")
CORS(app)  # simple open CORS policy

print("Bootstrapping recognizer … (takes a few seconds the first time)")
recognizer = RealTimeQuranASR(json_path=JSON_PATH, model_path=MODEL_PATH, audio_path=AUDIO_PATH)
t = threading.Thread(target=recognizer.synchronized_prediction, daemon=True)
t.start()
print("Ready ✔")

# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.post("/process")      # POST /process  -- returns JSON
def process_current_second():
    # Optionally allow client to override the timestamp via JSON body
    result = recognizer.process_current_time()
    return jsonify(result or {"status": "no-match"})

# ---------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, use_reloader=False, port=5000)
