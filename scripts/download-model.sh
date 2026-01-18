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

# DaKanji model
# https://github.com/CaptainDario/DaKanji-Single-Kanji-Recognition
DAKANJI_DIR="public/model/dakanji"
DAKANJI_RELEASE_URL="https://github.com/CaptainDario/DaKanji-Single-Kanji-Recognition/releases/download/v1.2/v1.2.zip"
DAKANJI_TMP_DIR="/tmp/dakanji-convert"

download_dakanji() {
  echo "Downloading and converting DaKanji model..."

  # Check if tensorflowjs_converter is available
  if ! command -v tensorflowjs_converter &> /dev/null; then
    echo "Error: tensorflowjs_converter not found."
    echo "Please install it first: pip install tensorflowjs"
    exit 1
  fi

  mkdir -p "$DAKANJI_DIR"
  mkdir -p "$DAKANJI_TMP_DIR"

  # Download the release
  echo "Downloading DaKanji v1.2..."
  curl -sL "$DAKANJI_RELEASE_URL" -o "$DAKANJI_TMP_DIR/v1.2.zip"

  # Extract
  echo "Extracting..."
  unzip -q -o "$DAKANJI_TMP_DIR/v1.2.zip" -d "$DAKANJI_TMP_DIR"

  # Convert to TensorFlow.js format
  echo "Converting to TensorFlow.js format..."
  tensorflowjs_converter \
    --input_format=tf_saved_model \
    --output_format=tfjs_graph_model \
    "$DAKANJI_TMP_DIR/v1.2/tf" \
    "$DAKANJI_DIR"

  # Cleanup
  rm -rf "$DAKANJI_TMP_DIR"

  echo "DaKanji model downloaded and converted successfully."
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
