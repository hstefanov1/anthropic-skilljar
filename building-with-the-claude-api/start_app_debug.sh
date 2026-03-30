#!/bin/bash

set -e
clear

echo
echo ".:: BUILDING WITH CLAUDE-API (DEBUGGING MODE) ::."
echo

if [[ "$1" ]]; then
  file_path="./src/$1.js"
else
  file_path="index.js"
fi
echo "Debugging file => $file_path"
echo

if [[ ! -f "$file_path" ]]; then
  echo "ERROR: file not found"
  echo
  exit 1
fi

bun --inspect-wait="localhost:6499/$file_path" "$file_path"

echo
echo "::: BASH COMPLETED SUCCESSFULLY :::"
echo
