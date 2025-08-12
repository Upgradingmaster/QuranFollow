#!/bin/sh

sqlite3 -json uthmani-15-lines.db "SELECT * FROM pages ORDER BY page_number, line_number;" \
  | jq 'group_by(.page_number)
        | map({(.[0].page_number|tostring): map(del(.page_number))})
        | add' > output.json
