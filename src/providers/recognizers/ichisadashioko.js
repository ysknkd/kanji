import * as tf from '@tensorflow/tfjs';
import { kanjiDict, labelDict } from '../../labels/ichisadashioko.js';

const MODEL_PATH = '/model/ichisadashioko/model.json';
const INPUT_SIZE = 64;

let model = null;

/**
 * ichisadashioko/kanji-recognition provider
 * https://github.com/ichisadashioko/kanji-recognition
 */
export const ichisadashiokoProvider = {
  async loadModel() {
    if (model) return;
    model = await tf.loadLayersModel(MODEL_PATH);
  },

  isLoaded() {
    return model !== null;
  },

  getModelInfo() {
    return {
      name: 'ichisadashioko/kanji-recognition',
      version: 'v3',
      characterCount: Object.keys(labelDict).length,
      inputSize: INPUT_SIZE
    };
  },

  async recognize(imageData, canvasWidth, canvasHeight, topK = 5) {
    if (!model) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    const inputTensor = this.preprocess(imageData, canvasWidth, canvasHeight);

    // Run inference
    const predictions = model.predict(inputTensor);
    const probabilities = await predictions.data();

    // Clean up tensors
    inputTensor.dispose();
    predictions.dispose();

    return this.postprocess(probabilities, topK);
  },

  supportsCharacter(char) {
    return char in kanjiDict;
  },

  // Private methods

  preprocess(imageData, originalWidth, originalHeight) {
    return tf.tidy(() => {
      // Convert ImageData to tensor
      let tensor = tf.browser.fromPixels(imageData, 1);

      // Find the bounding box of the drawing
      const bounds = this.findBoundingBox(imageData, originalWidth, originalHeight);

      if (!bounds) {
        // No drawing found, return empty tensor
        return tf.zeros([1, INPUT_SIZE, INPUT_SIZE, 1]);
      }

      // Crop to bounding box with padding
      const padding = 10;
      const x = Math.max(0, bounds.minX - padding);
      const y = Math.max(0, bounds.minY - padding);
      const width = Math.min(originalWidth - x, bounds.maxX - bounds.minX + padding * 2);
      const height = Math.min(originalHeight - y, bounds.maxY - bounds.minY + padding * 2);

      // Slice the tensor to get the cropped region
      tensor = tf.slice(tensor, [y, x, 0], [height, width, 1]);

      // Make it square by padding the shorter dimension
      const size = Math.max(width, height);
      const padY = Math.floor((size - height) / 2);
      const padX = Math.floor((size - width) / 2);

      // Pad with white (255)
      tensor = tf.pad(tensor, [[padY, size - height - padY], [padX, size - width - padX], [0, 0]], 255);

      // Resize to model input size
      tensor = tf.image.resizeBilinear(tensor, [INPUT_SIZE, INPUT_SIZE]);

      // Invert (white background -> black, black drawing -> white) and normalize to 0-1
      tensor = tf.sub(255, tensor);
      tensor = tf.div(tensor, 255);

      // Add batch dimension
      tensor = tf.expandDims(tensor, 0);

      return tensor;
    });
  },

  findBoundingBox(imageData, width, height) {
    const data = imageData.data;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let hasDrawing = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        // Check if pixel is not white (drawing exists)
        if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) {
          hasDrawing = true;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (!hasDrawing) return null;

    return { minX, minY, maxX, maxY };
  },

  postprocess(probabilities, topK) {
    const results = [];
    for (let i = 0; i < probabilities.length; i++) {
      results.push({ index: i, probability: probabilities[i] });
    }

    results.sort((a, b) => b.probability - a.probability);

    return results.slice(0, topK).map(r => ({
      character: labelDict[r.index],
      probability: r.probability,
      percentage: (r.probability * 100).toFixed(1)
    }));
  }
};
