#!/usr/bin/env python3
import json
import math
from pathlib import Path
from typing import Dict, List, Optional, NamedTuple
from collections import defaultdict
from functools import lru_cache
import re
import bisect
from faster_whisper import WhisperModel
import time
from time import perf_counter
import threading

import numpy as np
import soundfile as sf
from rapidfuzz import fuzz, process
from scipy.signal import resample_poly
import unicodedata
import subprocess


SURAH_NAMES = {
    1: "Al-Fātiḥah", 2: "Al-Baqarah", 3: "Āl-ʿImrān", 4: "An-Nisāʾ",
    5: "Al-Māʾidah", 6: "Al-Anʿām", 7: "Al-Aʿrāf", 8: "Al-Anfāl",
    9: "At-Tawbah", 10: "Yūnus", 11: "Hūd", 12: "Yūsuf",
    13: "Ar-Raʿd", 14: "Ibrāhīm", 15: "Al-Ḥijr", 16: "An-Naḥl",
    17: "Al-Isrāʾ", 18: "Al-Kahf", 19: "Maryam", 20: "Ṭā-Hā",
    21: "Al-Anbiyāʾ", 22: "Al-Ḥajj", 23: "Al-Muʾminūn",
    24: "An-Nūr", 25: "Al-Furqān", 26: "Ash-Shuʿarāʾ",
    27: "An-Naml", 28: "Al-Qaṣaṣ", 29: "Al-ʿAnkabūt",
    30: "Ar-Rūm", 31: "Luqmān", 32: "As-Sajdah", 33: "Al-Aḥzāb",
    34: "Sabaʾ", 35: "Fāṭir", 36: "Yā-Sīn", 37: "Aṣ-Ṣāffāt",
    38: "Ṣād", 39: "Az-Zumar", 40: "Ghāfir", 41: "Fuṣṣilat",
    42: "Ash-Shūrā", 43: "Az-Zukhruf", 44: "Ad-Dukhān",
    45: "Al-Jāthiyah", 46: "Al-Aḥqāf", 47: "Muḥammad",
    48: "Al-Fatḥ", 49: "Al-Ḥujurāt", 50: "Qāf", 51: "Adh-Dhāriyāt",
    52: "Aṭ-Ṭūr", 53: "An-Najm", 54: "Al-Qamar", 55: "Ar-Raḥmān",
    56: "Al-Wāqiʿah", 57: "Al-Ḥadīd", 58: "Al-Mujādilah",
    59: "Al-Ḥashr", 60: "Al-Mumtaḥanah", 61: "Aṣ-Ṣaff",
    62: "Al-Jumuʿah", 63: "Al-Munāfiqūn", 64: "At-Taghābun",
    65: "Aṭ-Ṭalāq", 66: "At-Taḥrīm", 67: "Al-Mulk",
    68: "Al-Qalam", 69: "Al-Ḥāqqah", 70: "Al-Maʿārij",
    71: "Nūḥ", 72: "Al-Jinn", 73: "Al-Muzzammil",
    74: "Al-Mudda ththir", 75: "Al-Qiyāmah", 76: "Al-Insān",
    77: "Al-Mursalāt", 78: "An-Nabaʾ", 79: "An-Nāziʿāt",
    80: "ʿAbasa", 81: "At-Takwīr", 82: "Al-Infiṭār",
    83: "Al-Muṭaffifīn", 84: "Al-Inshiqāq", 85: "Al-Burūj",
    86: "Aṭ-Ṭāriq", 87: "Al-Aʿlā", 88: "Al-Gāshiyah",
    89: "Al-Fajr", 90: "Al-Balad", 91: "Ash-Shams",
    92: "Al-Layl", 93: "Aḍ-Ḍuḥā", 94: "Ash-Sharḥ",
    95: "At-Tīn", 96: "Al-ʿAlaq", 97: "Al-Qadr",
    98: "Al-Bayyinah", 99: "Az-Zalzalah", 100: "Al-ʿĀdiyāt",
    101: "Al-Qāriʿah", 102: "At-Takāthur", 103: "Al-ʿAṣr",
    104: "Al-Humazah", 105: "Al-Fīl", 106: "Quraysh",
    107: "Al-Māʿūn", 108: "Al-Kawthar", 109: "Al-Kāfirūn",
    110: "An-Naṣr", 111: "Al-Masad", 112: "Al-Ikhlāṣ",
    113: "Al-Falāq", 114: "An-Nās",
}
# ============================ Data Structures ================================
class VerseInfo(NamedTuple):
    surah_name: str
    ayah_number: int
    start_pos: int
    end_pos: int
    text: str

class MatchResult(NamedTuple):
    verse_info: VerseInfo
    confidence: float
    matched_text: str

# ============================ Configuration =================================
class Config:
    SAMPLE_RATE = 16000
    CHUNK_DURATION_FORWARD  = 4.0
    CHUNK_DURATION_BACKWARD = 4.0
    MIN_MATCH_LENGTH = 8
    MIN_SIMILARITY_SCORE = 65
    ENERGY_THRESHOLD = 0.002

# ============================ Text Processing ================================
class ArabicTextProcessor:
    DIACRITICS = re.compile(r'[\u064B-\u065F\u0670\u0640]')
    NORMALIZE_CHARS = {
        'أ': 'ا', 'إ': 'ا', 'آ': 'ا',
        'ة': 'ه', 'ى': 'ي',
    }

    @classmethod
    @lru_cache(maxsize=10000)
    def normalize(cls, text: str) -> str:
        if not text:
            return ""
        t = cls.DIACRITICS.sub('', text)
        t = unicodedata.normalize('NFKC', t)
        for old_char, new_char in cls.NORMALIZE_CHARS.items():
            t = t.replace(old_char, new_char)
        return ' '.join(t.split()).strip()

# ============================ Quran Database =================================
class QuranDatabase:
    def __init__(self, json_dir: Path):
        self.verses: list[VerseInfo] = []
        self.verse_normalized: list[str] = []
        self._load_qul_data(json_dir)

    def _load_old_data(self, json_dir: Path) -> None:
        for p in sorted(json_dir.glob("*.json")):
            try:
                with p.open(encoding="utf-8") as f:
                    data = json.load(f)

                surah_name = data.get("englishName", p.stem)
                for idx, ayah in enumerate(data.get("ayahs", []), start=1):
                    if isinstance(ayah, dict) and ayah.get("text", "").strip():
                        self._add_verse(
                            surah_name=surah_name,
                            ayah_number=idx,
                            original_text=ayah["text"].strip(),
                        )
            except Exception as e:
                print(f"Warning: {p.name}: {e}")

        print(f"Loaded {len(self.verses)} verses from {json_dir}")

    def _load_qul_data(self, json_file: Path) -> None:
        try:
            with json_file.open(encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            print(f"Error reading {json_file}: {e}")
            return

        for key, verse in data.items():
            # key looks like "surah:ayah"
            try:
                surah_num, ayah_num = map(int, key.split(":"))
            except ValueError:
                print(f"Skipping malformed key {key!r}")
                continue

            original_text = verse.get("text", "").strip()
            if not original_text:
                continue

            self._add_verse(
                surah_name=SURAH_NAMES.get(surah_num, f"Surah {surah_num}"),
                ayah_number=ayah_num,
                original_text=original_text,
            )

        print(f"Loaded {len(self.verses)} verses from {json_file.name}")

    def _add_verse(self, *, surah_name: str, ayah_number: int, original_text: str) -> None:
        norm_text = ArabicTextProcessor.normalize(original_text)
        if not norm_text:
            return

        self.verses.append(
            VerseInfo(
                surah_name=surah_name,
                ayah_number=ayah_number,
                start_pos=0,             # not used
                end_pos=0,
                text=original_text,
            )
        )
        self.verse_normalized.append(norm_text)

    def find_best_match(self, transcription: str) -> Optional[MatchResult]:
        """Find the best matching verse for the given transcription."""
        if not transcription.strip():
            return None

        normalized_query = ArabicTextProcessor.normalize(transcription)
        if len(normalized_query) < Config.MIN_MATCH_LENGTH:
            return None

        best_match = None
        best_score = 0

        # Search through all verses
        for i, verse_norm in enumerate(self.verse_normalized):
            # Try exact match first
            if normalized_query in verse_norm:
                return MatchResult(
                    verse_info=self.verses[i],
                    confidence=1.0,
                    matched_text=normalized_query
                )

            # Fuzzy matching
            score = fuzz.token_set_ratio(normalized_query, verse_norm)
            if score > best_score and score >= Config.MIN_SIMILARITY_SCORE:
                best_score = score
                best_match = MatchResult(
                    verse_info=self.verses[i],
                    confidence=score / 100.0,
                    matched_text=verse_norm
                )

        return best_match

# ============================ Audio Manager ==================================
class AudioManager:
    def __init__(self, audio_path: Path):
        self.audio_path = audio_path
        self.audio_data = None
        self.sample_rate = Config.SAMPLE_RATE
        self.total_duration = 0.0
        self._load_audio()

    def _load_audio(self):
        data, sr = sf.read(str(self.audio_path), dtype="float32", always_2d=False)

        if data.ndim == 2:
            data = data.mean(axis=1)

        if sr != Config.SAMPLE_RATE:
            g = math.gcd(sr, Config.SAMPLE_RATE)
            up = Config.SAMPLE_RATE // g
            down = sr // g
            data = resample_poly(data, up, down)

        self.audio_data = data.astype(np.float32, copy=False)
        self.total_duration = len(self.audio_data) / Config.SAMPLE_RATE
        print(f"Audio loaded: {self.total_duration:.1f}s")

    def get_current_chunk(self, current_time: float) -> Optional[np.ndarray]:
        """Get audio chunk at current playback time."""
        start_sample = max(0,                    int(current_time - Config.CHUNK_DURATION_BACKWARD) * self.sample_rate)
        end_sample   = min(len(self.audio_data), int(current_time + Config.CHUNK_DURATION_FORWARD)  * self.sample_rate)

        if start_sample >= len(self.audio_data):
            return None

        chunk = self.audio_data[start_sample:end_sample]

        # Check energy threshold
        if self._get_rms(chunk) < Config.ENERGY_THRESHOLD:
            return None

        return chunk

    @staticmethod
    def _get_rms(audio: np.ndarray) -> float:
        if audio.size == 0:
            return 0.0
        return float(np.sqrt(np.mean(np.square(audio))))

# ============================ ASR Engine =====================================
class ASREngine:
    def __init__(self, model_path: str):
        # device = "cuda" if torch.cuda.is_available() else "cpu"
        device = "cpu"
        compute_type = "float16" if device == "cuda" else "int8"
        self.model = WhisperModel(model_path, device=device, compute_type=compute_type)
        # self.model = whisperx.load_model(model_path, device, compute_type=compute_type)
        print(f"ASR model loaded on {device}")

    def transcribe_chunk(self, audio_chunk: np.ndarray) -> str:
        """Transcribe a single audio chunk."""
        segments, _ = self.model.transcribe(
            audio_chunk,
            language="ar",
            beam_size=1,
            vad_filter=False,
            without_timestamps=True,
        )
        return "".join(seg.text for seg in segments).strip()
        # result = self.model.transcribe(audio_chunk,
        #                                batch_size=1,
        #                                language="ar")
        # return "".join(seg["text"] for seg in result["segments"]).strip()

# ============================ Real-time Recognizer ===========================
class RealTimeQuranASR:
    def __init__(self, json_dir: str, model_path: str):
        print("Initializing...")
        self.quran_db = QuranDatabase(Path(json_dir))
        self.asr = ASREngine(model_path)
        self.audio_manager = None
        self.last_verse_key = None
        self.last_emit_time = 0
        self.start_time = None
        self.is_playing = False
        print("Initialization done.\n")

    def load_audio(self, audio_path: Path):
        """Load audio file for processing."""
        self.audio_manager = AudioManager(audio_path)
        print(f"Audio ready: {self.audio_manager.total_duration:.1f}s")

    def process_current_time(self, current_time: float) -> Optional[dict]:
        """
        Process audio at the current playback time and return verse if found.
        This is the main function you'd call in real-time.
        """
        if not self.audio_manager:
            return None

        # Get current audio chunk
        chunk = self.audio_manager.get_current_chunk(current_time)
        if chunk is None:
            return None

        # Transcribe the chunk
        t0 = perf_counter()
        transcription = self.asr.transcribe_chunk(chunk)
        transcription_time = perf_counter() - t0

        if not transcription:
            return None

        # Find matching verse
        t0 = perf_counter()
        match = self.quran_db.find_best_match(transcription)
        match_time = perf_counter() - t0
        if not match:
            return None

        # Debounce - avoid repeating same verse too quickly
        verse_key = (match.verse_info.surah_name, match.verse_info.ayah_number)
        self.last_verse_key = verse_key
        self.last_emit_time = current_time

        # Return result
        result = {
            'timestamp': current_time,
            'surah': match.verse_info.surah_name,
            'ayah': match.verse_info.ayah_number,
            'arabic_text': match.verse_info.text,
            'confidence': match.confidence,
            'transcription': transcription,
            'tt': transcription_time,
            'tm': match_time,
        }

        return result

    def synchronized_prediction(self, audio_path: Path, start_time: float = 0):
        print(f"Synchronized Prediction")
        print("-" * 60)
        print("Run the model as fast as we can predicting on wherever we are in the audio")
        print("print to stdout")
        print("-" * 60)

        self.load_audio(audio_path)

        mpv_cmd = ["mpv", "--force-window", "--quiet", str(audio_path)]
        if start_time > 0:
            mpv_cmd.extend([f"--start={start_time}"])

        try:
            # Start mpv process
            mpv_process = subprocess.Popen(mpv_cmd)

            self.start_time = perf_counter() - start_time
            self.is_playing = True


            while self.is_playing:
                # Check if mpv is still running
                if mpv_process.poll() is not None:
                    break

                # Get current playback time
                current_time = perf_counter() - self.start_time

                # Stop if we've exceeded the audio duration
                if current_time > self.audio_manager.total_duration:
                    break

                # Process current time
                result = self.process_current_time(current_time)
                if result:
                    print(f"{result['timestamp']:6.1f}s | {result['surah']:20} - Ayah {result['ayah']:03d} | C: {result['confidence']:.2f} | TT: {result['tt']:.2f} | TM: {result['tm']:.2f}")

                # Small sleep to prevent excessive CPU usage
                time.sleep(0.01)

        except KeyboardInterrupt:
            print("\nStopped by user")

def main():
    # Initialize the system
    recognizer = RealTimeQuranASR(
        json_dir="uthmani.json",
       model_path="OdyAsh/faster-whisper-base-ar-quran"
    )

    audio_path = Path("/home/upgrade/Android/Quran/Surah_Taha_Jamal_AbdiNasir_QUALITY_QALOON_Taraweeh_Recitation_Masjid_al_Humera_رواية_قالون_سورة_طه.mp3")

    if audio_path.exists():
        recognizer.synchronized_prediction(audio_path)
if __name__ == "__main__":
    main()
