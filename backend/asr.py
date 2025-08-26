#!/usr/bin/env python3
import json
import sqlite3
from pathlib import Path
from typing import NamedTuple, Optional
from functools import lru_cache
import re
from faster_whisper import WhisperModel
from time import perf_counter
import numpy as np
from rapidfuzz import fuzz
import unicodedata
import logging


# ============================ Data Structures ================================
class VerseInfo(NamedTuple):
    surah_number: int
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
    CHUNK_DURATION_FORWARD = 2.0
    CHUNK_DURATION_BACKWARD = 4.0
    MIN_MATCH_LENGTH = 8
    MIN_SIMILARITY_SCORE = 65
    ENERGY_THRESHOLD = 0.002


# ============================ Text Processing ================================
# TODO: Currently Normalizing to match between QUL databases, but we need to normalized for the model to be optimized
class ArabicTextProcessor:
    # harakat + tatweel + superscript alef
    _RE_HARAKAT = re.compile(r"[\u064B-\u065F\u0670\u0640]")

    # Qur'anic annotation marks (stop signs, small high signs, etc.)
    _RE_QURAN_ANN = re.compile(r"[\u06D6-\u06ED\u08E4-\u08FF]")

    # Bidi / zero-width / BOM controls to strip
    _RE_CTRL = re.compile(r"[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]")

    _RE_WS = re.compile(r"\s+")

    _RE_AYAH_NUM = re.compile(
        r"""
        [\u06DD\u06DE\uFD3E\uFD3F\uFDFD]?   # ۝, ۞, ornate parens
        \s*
        [\(\[\{﴾⟬⟮]?\s*                   # opening bracket
        [\d\u0660-\u0669]+                # Western or Arabic-Indic digits
        \s*[\)\]\}﴿⟭⟯]?                   # closing bracket
        """,
        re.VERBOSE,
    )

    # Letter maps
    _MAP_BASE = str.maketrans(
        {
            "أ": "ا",
            "إ": "ا",
            "آ": "ا",
            "ٱ": "ا",
        }
    )

    _MAP_LENIENT = str.maketrans(
        {
            "أ": "ا",
            "إ": "ا",
            "آ": "ا",
            "ٱ": "ا",
            "ة": "ه",
            "ى": "ي",
        }
    )

    @staticmethod
    @lru_cache(maxsize=20000)
    def normalize(
        text: str,
        *,
        remove_harakat: bool = True,
        remove_quran_annotations: bool = True,
        remove_controls: bool = True,
        remove_ayah_numbers: bool = True,
        collapse_space: bool = True,
        lenient_letters: bool = False,
    ) -> str:
        if not text:
            return ""

        # Decompose → strip marks → recompose (safer than raw NFKC)
        t = unicodedata.normalize("NFKD", text)
        if remove_quran_annotations:
            t = ArabicTextProcessor._RE_QURAN_ANN.sub("", t)
        if remove_harakat:
            t = ArabicTextProcessor._RE_HARAKAT.sub("", t)
        if remove_controls:
            t = ArabicTextProcessor._RE_CTRL.sub("", t)
        if remove_ayah_numbers:
            t = ArabicTextProcessor._RE_AYAH_NUM.sub(" ", t)

        t = unicodedata.normalize("NFC", t)

        t = t.translate(
            ArabicTextProcessor._MAP_LENIENT
            if lenient_letters
            else ArabicTextProcessor._MAP_BASE
        )
        if collapse_space:
            t = ArabicTextProcessor._RE_WS.sub(" ", t).strip()

        return t

    # @staticmethod
    # def is_ayah_number(tok: str) -> bool:
    #     return tok == "۝" or bool(re.fullmatch(r"[\d\u0660-\u0669]+", tok))


# ============================ Quran Database =================================
class QuranDatabase:
    def __init__(self, script_db: Path):
        self.verses: list[VerseInfo] = []
        self.verse_normalized: list[str] = []
        if script_db.name.endswith("aba.db"):
            self._load_from_sqlite_aba(script_db)
        elif script_db.name.endswith("wbw.db"):
            self._load_from_sqlite_wbw(script_db)
        else:
            self._load_from_json(script_db)

    def _load_from_json(self, json_file: Path) -> None:
        try:
            with json_file.open(encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            logging.info(f"Error reading json db {json_file}: {e}")
            return

        for key, verse in data.items():
            # key looks like "surah:ayah"
            try:
                surah_num, ayah_num = map(int, key.split(":"))
            except ValueError:
                logging.info(f"Skipping malformed key {key!r}")
                continue

            original_text = verse.get("text", "").strip()
            if not original_text:
                continue

            self._add_verse(
                surah_number=surah_num,
                ayah_number=ayah_num,
                original_text=original_text,
            )

        logging.info(f"Loaded {len(self.verses)} verses from {json_file.name}")

    def _load_from_sqlite_aba(self, db_file: Path) -> None:
        try:
            con = sqlite3.connect(db_file)
            cur = con.cursor()
            cur.execute(
                "SELECT verse_key, surah, ayah, text FROM verses ORDER BY surah, ayah"
            )
        except Exception as e:
            logging.info(f"Error reading sqlite aba db {db_file}: {e}")
            return

        # for surah, ayah, word_idx, txt in cur:
        for verse_key, surah, ayah, txt in cur:
            self._add_verse(surah_number=surah, ayah_number=ayah, original_text=txt)

        con.close()
        logging.info(f"Loaded {len(self.verses)} verses from {db_file.name}")

    def _load_from_sqlite_wbw(self, db_file: Path) -> None:
        """
        Build one text string per āyah from the qpc-hafs-word-by-word DB.
        Table must have: surah, ayah, word, text  (order is controlled below).
        """
        try:
            con = sqlite3.connect(db_file)
            cur = con.cursor()
            cur.execute(
                "SELECT surah, ayah, word, text FROM words ORDER BY surah, ayah, word"
            )
        except Exception as e:
            logging.info(f"Error reading sqlite wbw db {db_file}: {e}")
            return

        current_key: tuple[int, int] | None = None
        buf: list[str] = []

        for surah, ayah, word_idx, txt in cur:
            # if ArabicTextProcessor.is_ayah_number(txt.strip()):
            #     continue
            key = (surah, ayah)
            if current_key and key != current_key:
                self._add_verse(
                    surah_number=current_key[0],
                    ayah_number=current_key[1],
                    original_text=" ".join(buf),
                )
                buf = []
            buf.append(txt.strip())
            current_key = key

        # flush last āyah
        if current_key:
            self._add_verse(
                surah_number=current_key[0],
                ayah_number=current_key[1],
                original_text=" ".join(buf),
            )

        con.close()
        logging.info(f"Loaded {len(self.verses)} verses from {db_file.name}")

    def _add_verse(
        self, *, surah_number: int, ayah_number: int, original_text: str
    ) -> None:
        norm_text = ArabicTextProcessor.normalize(original_text)
        if not norm_text:
            return

        self.verses.append(
            VerseInfo(
                surah_number=surah_number,
                ayah_number=ayah_number,
                start_pos=0,  # not used
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
                    matched_text=normalized_query,
                )

            # Fuzzy matching
            score = fuzz.token_set_ratio(normalized_query, verse_norm)
            if score > best_score and score >= Config.MIN_SIMILARITY_SCORE:
                best_score = score
                best_match = MatchResult(
                    verse_info=self.verses[i],
                    confidence=score / 100.0,
                    matched_text=verse_norm,
                )

        return best_match


# ============================ ASR Engine =====================================
class ASREngine:
    def __init__(self, model_name: str):
        device = "cpu"
        compute_type = "float16" if device == "cuda" else "int8"

        logging.info(f"Loading model: {model_name}")
        self.model = WhisperModel(model_name, device=device, compute_type=compute_type)
        logging.info("ASR model loaded.")

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
    def __init__(self, script_db: Path, model_name: str):
        logging.info("Initializing...")
        self.quran_db = QuranDatabase(script_db)
        self.asr = ASREngine(model_name)
        logging.info("Initialization done.\n")

    def process_chunk(self, chunk: np.ndarray):
        """
        Try to (1) transcribe `chunk` and then (2) match it to a verse.
        Even when either step fails we still return a dictionary with
        everything we know so far plus a `status` key describing the outcome.
        """
        # --- template for the result ---------------------------------------
        result = {
            "status": "ok",  # will be overwritten if we bail
            "surah": None,
            "ayah": None,
            "arabic_text": None,
            "confidence": None,
            "transcript": None,
            "tt": None,  # transcription time
            "tm": None,  # matching time
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
            status="matched",
            surah=match.verse_info.surah_number,
            ayah=match.verse_info.ayah_number,
            arabic_text=match.verse_info.text,
            confidence=match.confidence,
        )
        return result
