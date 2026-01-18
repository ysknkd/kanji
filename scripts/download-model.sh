#!/bin/bash
set -e

MODEL_DIR="public/model"
BASE_URL="https://raw.githubusercontent.com/ichisadashioko/kanji-recognition/gh-pages/kanji-model-v3-tfjs"

mkdir -p "$MODEL_DIR"

echo "Downloading model files..."
curl -sL "$BASE_URL/model.json" -o "$MODEL_DIR/model.json"
curl -sL "$BASE_URL/group1-shard1of3.bin" -o "$MODEL_DIR/group1-shard1of3.bin"
curl -sL "$BASE_URL/group1-shard2of3.bin" -o "$MODEL_DIR/group1-shard2of3.bin"
curl -sL "$BASE_URL/group1-shard3of3.bin" -o "$MODEL_DIR/group1-shard3of3.bin"

echo "Model files downloaded successfully."
