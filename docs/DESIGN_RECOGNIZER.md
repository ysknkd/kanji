# Recognizer Design

## Overview

This document describes the architecture for kanji recognition in the app. The design prioritizes model abstraction to enable easy migration between different ML models (e.g., ichisadashioko → DaKanji).

## Goals

1. **Model Agnostic**: Easy to switch between recognition models
2. **Browser-based Inference**: All inference runs client-side using TensorFlow.js
3. **Extensible**: Support for additional character sets (hiragana, katakana)
4. **Graceful Degradation**: Handle model loading failures gracefully

## Current vs Target Model

| Feature | Current (ichisadashioko) | Target (DaKanji) |
|---------|--------------------------|------------------|
| Characters | 2,199 kanji | ~3,000 kanji + kana |
| Input Size | 64x64 grayscale | Any size grayscale |
| Format | TensorFlow.js | TensorFlow (needs conversion) |
| JIS Level | Level 1 only | Level 1 + Level 2 |
| License | MIT | MIT |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Application                          │
│                         (main.js)                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   Recognizer Service  │
              │    (recognizer.js)    │
              └───────────┬───────────┘
                          │
                          │ implements
                          ▼
              ┌───────────────────────┐
              │  RecognizerProvider   │
              │     (interface)       │
              └───────────┬───────────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
              ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ichisadashioko│ │ DaKanji │ │  Future  │
        │  Provider │ │ Provider │ │ Provider │
        └──────────┘ └──────────┘ └──────────┘
```

## Interface Definition

### RecognizerProvider Interface

```javascript
/**
 * @typedef {Object} RecognitionResult
 * @property {string} character - The recognized character
 * @property {number} probability - Confidence score (0-1)
 * @property {string} percentage - Formatted percentage string
 */

/**
 * @typedef {Object} ModelInfo
 * @property {string} name - Model name
 * @property {string} version - Model version
 * @property {number} characterCount - Number of supported characters
 * @property {number} inputSize - Expected input size (pixels)
 */

/**
 * @typedef {Object} RecognizerProvider
 * @property {function(): Promise<void>} loadModel - Load the model
 * @property {function(): boolean} isLoaded - Check if model is loaded
 * @property {function(): ModelInfo} getModelInfo - Get model information
 * @property {function(ImageData, number, number): Promise<RecognitionResult[]>} recognize - Recognize character
 * @property {function(string): boolean} supportsCharacter - Check if character is supported
 */
```

## Provider Implementations

### Current Provider (ichisadashioko)

```javascript
// providers/ichisadashioko.js

const MODEL_PATH = '/model/ichisadashioko/model.json';
const INPUT_SIZE = 64;

export const ichisadashiokoProvider = {
  model: null,
  labels: null,

  async loadModel() {
    this.model = await tf.loadLayersModel(MODEL_PATH);
    this.labels = await import('./labels-ichisadashioko.js');
  },

  isLoaded() {
    return this.model !== null;
  },

  getModelInfo() {
    return {
      name: 'ichisadashioko/kanji-recognition',
      version: 'v3',
      characterCount: 2199,
      inputSize: 64
    };
  },

  async recognize(imageData, width, height, topK = 5) {
    const input = this.preprocess(imageData, width, height);
    const predictions = this.model.predict(input);
    return this.postprocess(predictions, topK);
  },

  supportsCharacter(char) {
    return this.labels.includes(char);
  },

  // Private: preprocess to 64x64 grayscale, inverted
  preprocess(imageData, width, height) {
    // ... existing preprocessing logic
  }
};
```

### DaKanji Provider (Target)

```javascript
// providers/dakanji.js

const MODEL_PATH = '/model/dakanji/model.json';
const INPUT_SIZE = 64; // DaKanji accepts any size but we normalize

export const dakanjioProvider = {
  model: null,
  labels: null,

  async loadModel() {
    this.model = await tf.loadLayersModel(MODEL_PATH);
    this.labels = await import('./labels-dakanji.js');
  },

  isLoaded() {
    return this.model !== null;
  },

  getModelInfo() {
    return {
      name: 'DaKanji',
      version: '1.2',
      characterCount: 3000,
      inputSize: 64
    };
  },

  async recognize(imageData, width, height, topK = 5) {
    const input = this.preprocess(imageData, width, height);
    const predictions = this.model.predict(input);
    return this.postprocess(predictions, topK);
  },

  supportsCharacter(char) {
    return this.labels.includes(char);
  },

  // Private: DaKanji-specific preprocessing
  preprocess(imageData, width, height) {
    // DaKanji expects different preprocessing
    // - Grayscale input
    // - May require different normalization
  }
};
```

## Service Layer

```javascript
// recognizer.js

import { RECOGNIZER_PROVIDER } from './config.js';
import { ichisadashiokoProvider } from './providers/ichisadashioko.js';
import { dakanjiProvider } from './providers/dakanji.js';

function getProvider() {
  switch (RECOGNIZER_PROVIDER) {
    case 'dakanji':
      return dakanjiProvider;
    case 'ichisadashioko':
    default:
      return ichisadashiokoProvider;
  }
}

const provider = getProvider();

export const recognizer = {
  loadModel() {
    return provider.loadModel();
  },

  isLoaded() {
    return provider.isLoaded();
  },

  getModelInfo() {
    return provider.getModelInfo();
  },

  recognize(imageData, width, height, topK = 5) {
    return provider.recognize(imageData, width, height, topK);
  },

  supportsCharacter(char) {
    return provider.supportsCharacter(char);
  }
};
```

## Configuration

```javascript
// config.js
export const RECOGNIZER_PROVIDER = 'ichisadashioko'; // 'ichisadashioko' | 'dakanji'
```

## Data Flow

### Recognition Flow

```
┌──────────┐   Draw    ┌──────────┐  getImageData  ┌──────────┐
│  User    │ ────────▶ │  Canvas  │ ─────────────▶ │  main.js │
└──────────┘           └──────────┘                └────┬─────┘
                                                        │
                       ┌────────────────────────────────┘
                       │ recognize(imageData)
                       ▼
           ┌───────────────────────┐
           │   Recognizer Service  │
           └───────────┬───────────┘
                       │
                       │ provider.recognize()
                       ▼
           ┌───────────────────────┐
           │      Provider         │
           │  - preprocess()       │
           │  - model.predict()    │
           │  - postprocess()      │
           └───────────┬───────────┘
                       │
                       ▼
           ┌───────────────────────┐
           │  RecognitionResult[]  │
           │  [{char, prob}, ...]  │
           └───────────────────────┘
```

## Model Conversion

### Converting DaKanji to TensorFlow.js

DaKanji provides TensorFlow SavedModel format. Conversion steps:

```bash
# 1. Install tensorflowjs converter
pip install tensorflowjs

# 2. Download DaKanji model from releases
wget https://github.com/CaptainDario/DaKanji-Single-Kanji-Recognition/releases/download/v1.2/model.zip

# 3. Convert to TensorFlow.js format
tensorflowjs_converter \
  --input_format=tf_saved_model \
  --output_format=tfjs_graph_model \
  ./saved_model \
  ./tfjs_model
```

### Model Files Structure

```
public/
└── model/
    ├── ichisadashioko/
    │   ├── model.json
    │   └── group1-shard*.bin
    └── dakanji/
        ├── model.json
        └── group1-shard*.bin
```

## Preprocessing Differences

| Aspect | ichisadashioko | DaKanji |
|--------|----------------|---------|
| Input Size | 64x64 fixed | Any (normalized to 64x64) |
| Color | Grayscale, inverted | Grayscale |
| Normalization | 0-1 | TBD (may differ) |
| Background | Black (after invert) | TBD |

## Labels Management

Each provider has its own labels file:

```javascript
// labels/ichisadashioko.js
export const labels = ['一', '二', '三', ...]; // 2,199 chars

// labels/dakanji.js
export const labels = ['一', '二', '三', ...]; // ~3,000 chars + kana
```

## Readings Integration

Readings data (`readings.js`) is provider-agnostic. However, when switching to DaKanji:

1. Generate new readings for additional characters
2. Add hiragana/katakana readings if supporting kana
3. Update `generate-readings.js` script

```bash
# Regenerate readings for new character set
node scripts/generate-readings.js --labels=dakanji
```

## File Structure

```
src/
├── recognizer.js              # Service layer (selects provider)
├── config.js                  # Add RECOGNIZER_PROVIDER
├── labels/
│   ├── ichisadashioko.js      # Current labels
│   └── dakanji.js             # DaKanji labels
└── providers/
    ├── recognizers/
    │   ├── ichisadashioko.js  # Current provider
    │   └── dakanji.js         # DaKanji provider
    ├── firebase.js
    └── local.js

public/
└── model/
    ├── ichisadashioko/        # Current model
    └── dakanji/               # DaKanji model (after conversion)

scripts/
├── download-model.sh          # Update for multiple models
└── convert-dakanji.sh         # New: model conversion script
```

## Migration Steps

### Phase 1: Refactor Current Implementation

1. Create `providers/recognizers/ichisadashioko.js` from current `recognizer.js`
2. Create `labels/ichisadashioko.js` from current `labels.js`
3. Update `recognizer.js` to use service pattern
4. Move model files to `public/model/ichisadashioko/`
5. Add `RECOGNIZER_PROVIDER` to `config.js`
6. Test that current functionality still works

### Phase 2: Add DaKanji Provider

1. Download and convert DaKanji model to TensorFlow.js
2. Extract labels from DaKanji (`labels.txt`)
3. Create `providers/recognizers/dakanji.js`
4. Create `labels/dakanji.js`
5. Determine preprocessing requirements
6. Update `download-model.sh` to support both models

### Phase 3: Switch to DaKanji

1. Set `RECOGNIZER_PROVIDER = 'dakanji'` in config
2. Update readings for new characters
3. Test recognition quality
4. Deploy and validate

## Testing

### Unit Tests

```javascript
describe('RecognizerProvider', () => {
  it('should load model successfully', async () => {
    await provider.loadModel();
    expect(provider.isLoaded()).toBe(true);
  });

  it('should return model info', () => {
    const info = provider.getModelInfo();
    expect(info.name).toBeDefined();
    expect(info.characterCount).toBeGreaterThan(0);
  });

  it('should recognize kanji', async () => {
    const results = await provider.recognize(testImageData, 280, 280);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].character).toBeDefined();
  });
});
```

### Integration Tests

- Test model loading on slow connections
- Test recognition accuracy with known characters
- Test fallback behavior on load failure

## Future Considerations

### Additional Models

The abstraction allows adding more models:

- **Google ML Kit**: If web version becomes available
- **Custom trained model**: For specific use cases
- **Ensemble**: Combine multiple models for better accuracy

### Offline Support

- Cache models with Service Worker
- Store model files in IndexedDB
- Progressive loading for large models

### Performance Optimization

- Model quantization for smaller file size
- WebGL backend optimization
- Batch prediction for multiple strokes
