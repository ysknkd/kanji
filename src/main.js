import './style.css';
import { DrawingCanvas } from './canvas.js';
import { loadModel, recognize } from './recognizer.js';
import { readings } from './readings.js';
import { getHistory, addToHistory, removeFromHistory } from './history.js';

const statusEl = document.getElementById('status');
const recognizeBtn = document.getElementById('recognize-btn');
const clearBtn = document.getElementById('clear-btn');
const resultsEl = document.getElementById('results');
const historyEl = document.getElementById('history');
const canvasEl = document.getElementById('drawing-canvas');
const hintEl = document.getElementById('canvas-hint');

let drawingCanvas;

function setStatus(message, type = '') {
  statusEl.textContent = message;
  statusEl.className = type;
}

function getReadingText(character) {
  const r = readings[character];
  if (!r) return '';

  const parts = [];
  if (r.on && r.on.length > 0) {
    parts.push(r.on.join('・'));
  }
  if (r.kun && r.kun.length > 0) {
    parts.push(r.kun.join('・'));
  }
  return parts.join(' / ');
}

function handleSave(character) {
  const readingText = getReadingText(character);
  addToHistory(character, readingText);
  renderHistory();
}

function handleDelete(character) {
  removeFromHistory(character);
  renderHistory();
}

function renderResults(results) {
  if (!results || results.length === 0) {
    resultsEl.innerHTML = '<div class="no-results">漢字を書いてください</div>';
    return;
  }

  resultsEl.innerHTML = results.map(r => {
    const readingText = getReadingText(r.character);
    return `
      <div class="result-item">
        <span class="result-character">${r.character}</span>
        <div class="result-info">
          <div class="result-reading">${readingText}</div>
          <div class="result-bar-container">
            <div class="result-bar">
              <div class="result-bar-fill" style="width: ${r.percentage}%"></div>
            </div>
            <span class="result-percentage">${r.percentage}%</span>
          </div>
        </div>
        <button class="save-btn" data-character="${r.character}">保存</button>
      </div>
    `;
  }).join('');

  // Add event listeners to save buttons
  resultsEl.querySelectorAll('.save-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      handleSave(btn.dataset.character);
      btn.textContent = '保存済';
      btn.disabled = true;
    });
  });
}

function renderHistory() {
  const history = getHistory();

  if (history.length === 0) {
    historyEl.innerHTML = '<div class="no-results">保存した漢字はありません</div>';
    return;
  }

  historyEl.innerHTML = history.map(item => `
    <div class="history-item">
      <span class="history-character">${item.character}</span>
      <span class="history-reading">${item.readings}</span>
      <button class="delete-btn" data-character="${item.character}">削除</button>
    </div>
  `).join('');

  // Add event listeners to delete buttons
  historyEl.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      handleDelete(btn.dataset.character);
    });
  });
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
  renderHistory();

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
