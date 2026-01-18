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

# DaKanji model (placeholder for future)
# DAKANJI_DIR="public/model/dakanji"
# download_dakanji() {
#   echo "Downloading DaKanji model..."
#   mkdir -p "$DAKANJI_DIR"
#   # TODO: Add DaKanji model download
#   echo "DaKanji model downloaded successfully."
# }

# Download models based on argument or download all by default
case "${1:-all}" in
  ichisadashioko)
    download_ichisadashioko
    ;;
  dakanji)
    echo "DaKanji model download not implemented yet"
    exit 1
    ;;
  all)
    download_ichisadashioko
    # download_dakanji  # Enable when DaKanji is implemented
    ;;
  *)
    echo "Usage: $0 [ichisadashioko|dakanji|all]"
    exit 1
    ;;
esac

echo "Model download complete."
