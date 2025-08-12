#!/bin/sh

sqlite3 -json uthmani-wbw.db "SELECT * FROM words;" \
  | jq 'map({(.id|tostring): del(.id)}) | add' > output.json
