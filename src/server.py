#!/usr/bin/env python3
from pathlib import Path
import io
import soundfile as sf
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from asr import RealTimeQuranASR, Config

# ---------------------------------------------------------------------------
SCRIPT_DB     =  Path("./src/static/res/scripts/db/uthmani-wbw.db")
MODEL_NAME    = "OdyAsh/faster-whisper-base-ar-quran"
# MODEL_NAME    = "tarteel-ai/whisper-base-ar-quran"
# TODO: try the normal whisper models

app = Flask(__name__, static_folder="static")
CORS(app)  # simple open CORS policy

print("Bootstrapping recognizer (takes a few seconds the first time)")
recognizer = RealTimeQuranASR(script_db=SCRIPT_DB, model_name=MODEL_NAME)
print("Ready ✔")

# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.post('/process_chunk')
def process_chunk():
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
