#!/bin/bash
set -e

# ichisadashioko/kanji-recognition model
ICHISADASHIOKO_DIR="public/model/ichisadashioko"
ICHISADASHIOKO_URL="https://raw.githubusercontent.com/ichisadashioko/kanji-recognition/gh-pages/kanji-model-v3-tfjs"

download_ichisadashioko() {
  echo "Downloading ichisadashioko model..."
  mkdir -p "$ICHISADASHIOKO_DIR"
  curl -sL "$ICHISADASHIOKO_URL/model.json" -o "$ICHISADASHIOKO_DIR/model.json"
  curl -sL "$ICHISADASHIOKO_URL/group1-shard1of3.bin" -o "$ICHISADASHIOKO_DIR/group1-shard1of3.bin"
  curl -sL "$ICHISADASHIOKO_URL/group1-shard2of3.bin" -o "$ICHISADASHIOKO_DIR/group1-shard2of3.bin"
  curl -sL "$ICHISADASHIOKO_URL/group1-shard3of3.bin" -o "$ICHISADASHIOKO_DIR/group1-shard3of3.bin"
  echo "ichisadashioko model downloaded successfully."
}

# DaKanji model (pre-converted TensorFlow.js)
# Original: https://github.com/CaptainDario/DaKanji-Single-Kanji-Recognition (MIT License)
# Credit: Character recognition powered by machine learning from CaptainDario (DaAppLab)
DAKANJI_DIR="public/model/dakanji"
DAKANJI_TFJS_URL="https://github.com/ysknkd/kanji/releases/download/models-v1.0/dakanji-tfjs-v1.2.zip"

download_dakanji() {
  echo "Downloading DaKanji model..."

  mkdir -p "$DAKANJI_DIR"

  # Download pre-converted TensorFlow.js model
  echo "Downloading DaKanji TensorFlow.js model..."
  curl -sL "$DAKANJI_TFJS_URL" -o "/tmp/dakanji-tfjs.zip"

  # Extract
  echo "Extracting..."
  unzip -q -o "/tmp/dakanji-tfjs.zip" -d "$DAKANJI_DIR"

  # Cleanup
  rm -f "/tmp/dakanji-tfjs.zip"

  echo "DaKanji model downloaded successfully."
}

# Download models based on argument or download all by default
case "${1:-all}" in
  ichisadashioko)
    download_ichisadashioko
    ;;
  dakanji)
    download_dakanji
    ;;
  all)
    download_ichisadashioko
    download_dakanji
    ;;
  *)
    echo "Usage: $0 [ichisadashioko|dakanji|all]"
    exit 1
    ;;
esac

echo "Model download complete."
