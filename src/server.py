#!/usr/bin/env python3
from pathlib import Path
import threading

import io
import soundfile as sf
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from asr import RealTimeQuranASR
from asr import Config

# ---------------------------------------------------------------------------
# JSON_PATH    = Path("./static/res/uthmani-aba.db"       )  # this is the original
# JSON_PATH    = Path("./static/res/uthmani-wbw.db"       )  #
# JSON_PATH    = Path("./static/res/uthmani-simple-aba.db")  #
# JSON_PATH    = Path("./static/res/uthmani-simple-wbw.db")  #

MODEL_PATH   = "OdyAsh/faster-whisper-base-ar-quran"

app = Flask(__name__, static_folder="static")
CORS(app)  # simple open CORS policy

print("Bootstrapping recognizer (takes a few seconds the first time)")
recognizer = RealTimeQuranASR(json_path=JSON_PATH, model_path=MODEL_PATH)
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
    if sr != Config.SAMPLE_RATE:
        return jsonify({"error":f"sample-rate {sr} ≠ {Config.SAMPLE_RATE}"}), 400

    result = recognizer.process_chunk(data)
    return jsonify(result)

# ---------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)
