#!/bin/bash

set -e
clear

echo
echo ".:: BUILDING WITH CLAUDE-API ::."
echo

if [[ "$1" ]]; then
  file_path="./src/$1.js"
else
  file_path="index.js"
fi
echo "Running file => $file_path"
echo

if [[ ! -f "$file_path" ]]; then
  echo "ERROR: file not found"
  echo
  exit 1
fi

bun run "$file_path"

echo
echo "::: BASH COMPLETED SUCCESSFULLY :::"
echo
