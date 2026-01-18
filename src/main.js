import './style.css';
import { DrawingCanvas } from './canvas.js';
import { loadModel, recognize } from './recognizer.js';

const statusEl = document.getElementById('status');
const recognizeBtn = document.getElementById('recognize-btn');
const clearBtn = document.getElementById('clear-btn');
const resultsEl = document.getElementById('results');
const canvasEl = document.getElementById('drawing-canvas');
const hintEl = document.getElementById('canvas-hint');

let drawingCanvas;

function setStatus(message, type = '') {
  statusEl.textContent = message;
  statusEl.className = type;
}

function renderResults(results) {
  if (!results || results.length === 0) {
    resultsEl.innerHTML = '<div class="no-results">漢字を書いてください</div>';
    return;
  }

  resultsEl.innerHTML = results.map(r => `
    <div class="result-item">
      <span class="result-character">${r.character}</span>
      <div class="result-bar-container">
        <div class="result-bar">
          <div class="result-bar-fill" style="width: ${r.percentage}%"></div>
        </div>
        <span class="result-percentage">${r.percentage}%</span>
      </div>
    </div>
  `).join('');
}

function hideHint() {
  hintEl.classList.add('hidden');
}

function showHint() {
  hintEl.classList.remove('hidden');
}

async function handleRecognize() {
  if (drawingCanvas.isEmpty()) {
    setStatus('漢字を書いてください', 'error');
    return;
  }

  recognizeBtn.disabled = true;
  setStatus('認識中...');

  try {
    const imageData = drawingCanvas.getImageData();
    const results = await recognize(imageData, canvasEl.width, canvasEl.height);
    renderResults(results);
    setStatus('');
  } catch (error) {
    console.error('Recognition error:', error);
    setStatus('認識エラーが発生しました', 'error');
  } finally {
    recognizeBtn.disabled = false;
    drawingCanvas.deactivate();
  }
}

function handleClear() {
  drawingCanvas.clear();
  drawingCanvas.deactivate();
  showHint();
  resultsEl.innerHTML = '<div class="no-results">漢字を書いてください</div>';
  setStatus('');
}

async function init() {
  drawingCanvas = new DrawingCanvas(canvasEl, {
    onActivate: hideHint
  });

  recognizeBtn.addEventListener('click', handleRecognize);
  clearBtn.addEventListener('click', handleClear);

  renderResults(null);

  try {
    await loadModel();
    setStatus('準備完了', 'success');
    recognizeBtn.disabled = false;
  } catch (error) {
    console.error('Failed to load model:', error);
    setStatus('モデルの読み込みに失敗しました', 'error');
  }
}

init();
