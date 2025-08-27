#!/usr/bin/env python3
"""
Native messaging host for Quran Locater
"""
import sys
import json
import struct
import base64
import io
import soundfile as sf
from pathlib import Path
from asr import RealTimeQuranASR, Config
import logging
from datetime import datetime

# TODO better logging between Native host logs and internal logs
# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('native_host.log'),
        logging.StreamHandler(sys.stderr)
    ]
)

def read_message():
    """Read a message from the extension"""
    # Read length
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length: return None
    message_length = struct.unpack('=I', raw_length)[0]

    # Read message
    message = sys.stdin.buffer.read(message_length).decode('utf-8')
    return json.loads(message)

def send_message(message):
    """Send a message to the extension"""
    encoded_message = json.dumps(message).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('=I', len(encoded_message)))
    sys.stdout.buffer.write(encoded_message)
    sys.stdout.buffer.flush()

def process_audio_data(audio_data_b64):
    """Process base64-encoded WAV audio data"""
    try:
        audio_bytes = base64.b64decode(audio_data_b64)
        data, sr = sf.read(io.BytesIO(audio_bytes), dtype='float32')
        if sr != Config.SAMPLE_RATE:
            return {
                "ok": False,
                "error": f"sample-rate {sr} != {Config.SAMPLE_RATE}"
            }

        result = recognizer.process_chunk(data)

        return {
            "ok": True,
            "result": result
        }

    except Exception as e:
        logging.info(f"Error processing audio: {str(e)}")
        return {
            "ok": False,
            "error": str(e)
        }

SCRIPT_DB = Path("../../extension/data/scripts/uthmani-aba.json")
MODEL_NAME = "OdyAsh/faster-whisper-base-ar-quran"
# MODEL_NAME = "tarteel-ai/whisper-base-ar-quran" TODO: code doesn't support other models

def main():
    """Main message processing loop"""
    logging.info("Native messaging host started")

    logging.info("Starting Backend...")
    global recognizer
    recognizer = RealTimeQuranASR(script_db=SCRIPT_DB, model_name=MODEL_NAME)
    logging.info("Backend ready.")

    try:
        while True:
            message = read_message()
            if message is None:
                break

            logging.info(f"Received message: {message.get('action', 'unknown')}")

            if message.get('action') == 'process_audio':
                audio_data = message.get('data')
                if not audio_data:
                    send_message({
                        "ok": False,
                        "error": "No audio data provided"
                    })
                    continue

                response = process_audio_data(audio_data)
                send_message(response)

            elif message.get('action') == 'ping':
                send_message({"ok": True, "message": "pong"})

            else:
                send_message({
                    "ok": False,
                    "error": f"Unknown action: {message.get('action')}"
                })

    except Exception as e:
        logging.info(f"Error in main loop: {str(e)}")
        send_message({
            "ok": False,
            "error": f"Host error: {str(e)}"
        })

if __name__ == "__main__":
    main()
