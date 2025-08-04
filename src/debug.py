#!/usr/bin/env python3
from asr import RealTimeQuranASR
from asr import QuranDatabase
from asr import Config
from pathlib import Path
import sys

import difflib, unicodedata

def codepoint_with_name(c):
    return f"{repr(c)} U+{ord(c):04X} {unicodedata.name(c, '<unnamed>')}"

def diff_codepoints(a: str, b: str):
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            continue
        print(f"{tag.upper():7} a[{i1}:{i2}]  b[{j1}:{j2}]")
        for i in range(i1, i2):
            print(f"  - a[{i}]: {codepoint_with_name(a[i])}")
        for j in range(j1, j2):
            print(f"  + b[{j}]: {codepoint_with_name(b[j])}")

def compare(src1, src2):
    db1 = QuranDatabase(src1)
    db2 = QuranDatabase(src2)

    matches = 0
    total   = min(len(db1.verses), len(db2.verses))
    if (total == 0):
        print(f"Empty db")
        return

    for i in range(total):
        s1 = db1.verse_normalized[i]
        s2 = db2.verse_normalized[i]
        if (s1 == s2):
            matches += 1
        else:
            print(f"Failed: {i}")
            print(s1)
            print(s2)
            diff_codepoints(s1, s2)
            print("--------------------")
            print()

    print(f"Match Rate: {matches/total:.2f}%")

if __name__ == "__main__":
    uthmani_aba =   Path("./static/res/uthmani/uthmani-aba.db"       )
    uthmani_wbw =   Path("./static/res/uthmani/uthmani-wbw.db"       )
    uthmani_s_aba = Path("./static/res/uthmani/uthmani-simple-aba.db")
    uthmani_s_wbw = Path("./static/res/uthmani/uthmani-simple-wbw.db")
    compare(uthmani_aba, uthmani_wbw)

    print("----------Manual----------")
