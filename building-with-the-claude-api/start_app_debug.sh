#!/bin/bash

set -e
clear

echo
echo ".:: BUILDING WITH CLAUDE-API (DEBUGGING MODE) ::."
echo

if [[ ! "$1" ]]; then
  read -rp "Enter file name: ./src/"
  file_path="./src/$REPLY"
  echo
else
  file_path="./src/$1"
fi
echo "Debugging file => $file_path"
echo

if [[ ! -f "$file_path" ]]; then
  echo "ERROR: file not found"
  echo
  exit 1
fi

bun --inspect-brk "$file_path"

echo
echo "::: BASH COMPLETED SUCCESSFULLY :::"
echo
