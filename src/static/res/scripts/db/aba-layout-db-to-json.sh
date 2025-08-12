#!/bin/sh

sqlite3 -json uthmani-aba.db "SELECT * FROM verses;" \
  | jq 'map({(.verse_key|tostring): del(.verse_key)}) | add' > output.json
