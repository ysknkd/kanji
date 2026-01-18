import { RECOGNIZER_PROVIDER } from './config.js';
import { ichisadashiokoProvider } from './providers/recognizers/ichisadashioko.js';
import { dakanjiProvider } from './providers/recognizers/dakanji.js';

// Select recognizer provider based on configuration
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

// Recognizer service - exposes a consistent interface regardless of provider
export const recognizer = {
  /**
   * Load the recognition model
   * @returns {Promise<void>}
   */
  loadModel() {
    return provider.loadModel();
  },

  /**
   * Check if the model is loaded
   * @returns {boolean}
   */
  isLoaded() {
    return provider.isLoaded();
  },

  /**
   * Get model information
   * @returns {ModelInfo}
   */
  getModelInfo() {
    return provider.getModelInfo();
  },

  /**
   * Recognize character from image data
   * @param {ImageData} imageData - Canvas image data
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   * @param {number} topK - Number of top results to return
   * @returns {Promise<RecognitionResult[]>}
   */
  recognize(imageData, canvasWidth, canvasHeight, topK = 5) {
    return provider.recognize(imageData, canvasWidth, canvasHeight, topK);
  },

  /**
   * Check if a character is supported by the model
   * @param {string} char - Character to check
   * @returns {boolean}
   */
  supportsCharacter(char) {
    return provider.supportsCharacter(char);
  }
};

// Export legacy functions for backward compatibility
export async function loadModel() {
  return recognizer.loadModel();
}

export function isModelLoaded() {
  return recognizer.isLoaded();
}

export async function recognize(imageData, canvasWidth, canvasHeight, topK = 5) {
  return recognizer.recognize(imageData, canvasWidth, canvasHeight, topK);
}
