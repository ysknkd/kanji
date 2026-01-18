import './style.css';
import { DrawingCanvas } from './canvas.js';
import { loadModel, recognize } from './recognizer.js';
import { readings } from './readings.js';
import { auth } from './services/auth.js';
import { storage } from './services/storage.js';
import { FEATURES } from './config.js';

const statusEl = document.getElementById('status');
const recognizeBtn = document.getElementById('recognize-btn');
const clearBtn = document.getElementById('clear-btn');
const resultsEl = document.getElementById('results');
const historyEl = document.getElementById('history');
const canvasEl = document.getElementById('drawing-canvas');
const hintEl = document.getElementById('canvas-hint');
const authContainerEl = document.getElementById('auth-container');
const loginPromptEl = document.getElementById('login-prompt');

let drawingCanvas;
let currentUser = null;

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

async function handleSave(character) {
  const readingText = getReadingText(character);
  const item = {
    character,
    readings: readingText,
    savedAt: Date.now()
  };
  await storage.addToHistory(currentUser?.id || null, item);
  await renderHistory();
}

async function handleDelete(character) {
  await storage.removeFromHistory(currentUser?.id || null, character);
  await renderHistory();
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
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = '保存中...';
      await handleSave(btn.dataset.character);
      btn.textContent = '保存済';
    });
  });
}

async function renderHistory() {
  const history = await storage.getHistory(currentUser?.id || null);

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
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      await handleDelete(btn.dataset.character);
    });
  });
}

function renderAuthUI() {
  if (!auth.isConfigured()) {
    authContainerEl.style.display = 'none';
    loginPromptEl.style.display = 'none';
    return;
  }

  if (currentUser) {
    // Logged in state
    authContainerEl.innerHTML = `
      <div class="user-info">
        <img src="${currentUser.photoURL || ''}" alt="" class="user-avatar" />
        <span class="user-name">${currentUser.displayName || currentUser.email}</span>
        <button id="logout-btn" class="auth-btn">ログアウト</button>
      </div>
    `;
    loginPromptEl.style.display = 'none';

    document.getElementById('logout-btn').addEventListener('click', handleLogout);
  } else {
    // Logged out state
    authContainerEl.innerHTML = `
      <button id="login-btn" class="auth-btn login-btn">
        <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Googleでログイン
      </button>
    `;
    loginPromptEl.style.display = 'block';

    document.getElementById('login-btn').addEventListener('click', handleLogin);
  }
}

async function handleLogin() {
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.textContent = 'ログイン中...';
  }

  try {
    await auth.signIn();
    // Re-render history after migration completes
    await renderHistory();
  } catch (error) {
    console.error('Login failed:', error);
    setStatus('ログインに失敗しました', 'error');
    renderAuthUI();
  }
}

async function handleLogout() {
  try {
    await auth.signOut();
    // Auth state change will trigger UI update
  } catch (error) {
    console.error('Logout failed:', error);
    setStatus('ログアウトに失敗しました', 'error');
  }
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

  // Set up auth state listener
  auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    renderAuthUI();
    await renderHistory();
  });

  renderResults(null);
  renderAuthUI();
  await renderHistory();

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
