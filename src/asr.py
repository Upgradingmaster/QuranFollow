#!/usr/bin/env python3
import json
import math
from pathlib import Path
from typing import NamedTuple, Optional
from functools import lru_cache
import re
from faster_whisper import WhisperModel
import time
from time import perf_counter
import numpy as np
from rapidfuzz import fuzz
import unicodedata


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
    def __init__(self, json_path: Path):
        self.verses: list[VerseInfo] = []
        self.verse_normalized: list[str] = []
        self._load_data(json_path)

    def _load_data(self, json_file: Path) -> None:
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
# ============================ ASR Engine =====================================
class ASREngine:
    def __init__(self, model_path: str):
        device = "cpu"
        compute_type = "float16" if device == "cuda" else "int8"
        self.model = WhisperModel(model_path, device=device, compute_type=compute_type)
        print(f"ASR model loaded.")

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
# ============================ Real-time Recognizer ===========================
class RealTimeQuranASR:
    def __init__(self, json_path: str, model_path: str):
        print("Initializing...")
        self.quran_db      = QuranDatabase(Path(json_path))
        self.asr           = ASREngine(model_path)
        print("Initialization done.\n")

    def process_chunk(self, chunk: np.ndarray):
        """
        Try to (1) transcribe `chunk` and then (2) match it to a verse.
        Even when either step fails we still return a dictionary with
        everything we know so far plus a `status` key describing the outcome.
        """
        # --- template for the result ---------------------------------------
        result = {
            "status":       "ok",        # will be overwritten if we bail
            "surah":        None,
            "ayah":         None,
            "arabic_text":  None,
            "confidence":   None,
            "transcript":   None,
            "tt":           None,        # transcription time
            "tm":           None,        # matching time
        }

        # --- sanity check ---------------------------------------------------
        if chunk.size == 0:
            result["status"] = "empty-chunk"
            return result

        # --- 1) ASR ---------------------------------------------------------
        t0 = perf_counter()
        transcription = self.asr.transcribe_chunk(chunk)
        result["tt"] = perf_counter() - t0
        result["transcript"] = transcription

        if not transcription:
            result["status"] = "no-transcription"
            return result

        # --- 2) Match against Qurʾān DB ------------------------------------
        t0 = perf_counter()
        match = self.quran_db.find_best_match(transcription)
        result["tm"] = perf_counter() - t0

        if not match:
            result["status"] = "no-match"
            return result

        # --- success --------------------------------------------------------
        result.update(
            status       = "matched",
            surah        = match.verse_info.surah_name,
            ayah         = match.verse_info.ayah_number,
            arabic_text  = match.verse_info.text,
            confidence   = match.confidence,
        )

        return result
