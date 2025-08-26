#!/usr/bin/env python3
from pathlib import Path
import io
import soundfile as sf
from flask import Flask, jsonify, send_from_directory, request, send_file
from flask_cors import CORS
from asr import RealTimeQuranASR, Config
import mimetypes

# ---------------------------------------------------------------------------
SCRIPT_DB     =  Path("../extension/data/scripts/uthmani-aba.json")
MODEL_NAME    = "OdyAsh/faster-whisper-base-ar-quran"
# MODEL_NAME    = "tarteel-ai/whisper-base-ar-quran"
# TODO: try the normal whisper models

app = Flask(__name__, static_folder="../website")
CORS(app)  # simple open CORS policy

# Configure MIME types for ES6 modules
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/javascript', '.mjs')

print("Starting Backend...")
recognizer = RealTimeQuranASR(script_db=SCRIPT_DB, model_name=MODEL_NAME)
print("Backend Ready.")

# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return send_from_directory("../website", "index.html")

@app.route('/<path:filename>')
def static_files(filename):
    """Serve static files with correct MIME types"""
    try:
        # Check if it's a JavaScript file and set correct MIME type
        if filename.endswith('.js'):
            return send_from_directory("../website", filename, mimetype='application/javascript')
        else:
            return send_from_directory("../website", filename)
    except Exception as e:
        return jsonify({"error": f"File not found: {filename}"}), 404

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
