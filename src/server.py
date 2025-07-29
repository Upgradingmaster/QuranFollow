#!/usr/bin/env python3
from pathlib import Path
import threading

import io
import soundfile as sf
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from main import RealTimeQuranASR

# ---------------------------------------------------------------------------

JSON_PATH    = "uthmani.json"
MODEL_PATH   = "OdyAsh/faster-whisper-base-ar-quran"
AUDIO_PATH   = Path("/home/upgrade/Android/Quran/Surah_Taha_Jamal_AbdiNasir_QUALITY_QALOON_Taraweeh_Recitation_Masjid_al_Humera_رواية_قالون_سورة_طه.mp3")

app = Flask(__name__, static_folder="static")
CORS(app)  # simple open CORS policy

print("Bootstrapping recognizer (takes a few seconds the first time)")
recognizer = RealTimeQuranASR(json_path=JSON_PATH, model_path=MODEL_PATH, audio_path=AUDIO_PATH)
# threading.Thread(target=recognizer.play_audio_blocking, daemon=True).start()
print("Ready ✔")

# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.post('/process_chunk')
def process_chunk():
    """
    Expects multipart/form-data with a file field named 'chunk'
    containing mono-16 kHz little-endian WAV.
    """
    file = request.files.get('chunk')
    if not file:
        return jsonify({"error":"no file"}), 400

    # read bytes into numpy float32
    data, sr = sf.read(io.BytesIO(file.read()), dtype='float32')
    if sr != 16000: # TODO:
        return jsonify({"error":f"sample-rate {sr} ≠ 16000"}), 400

    result = recognizer.process_chunk(data)
    return jsonify(result or {"status":"no-match"})

# ---------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)
