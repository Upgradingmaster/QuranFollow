#!/bin/sh

# TODO: make this generic when we support more translations

sqlite3 -json en-sahih-international-simple.db "SELECT * FROM translation;" \
  | jq 'map({(.ayah_key|tostring): del(.ayah_key)}) | add' > output.json
