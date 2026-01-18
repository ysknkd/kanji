const STORAGE_KEY = 'kanji-history';

export function getHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    console.error('Failed to save history to localStorage');
  }
}

export function addToHistory(character, readings) {
  const history = getHistory();

  // Check if already exists
  const existingIndex = history.findIndex(item => item.character === character);
  if (existingIndex !== -1) {
    // Move to top
    history.splice(existingIndex, 1);
  }

  // Add to beginning
  history.unshift({
    character,
    readings,
    savedAt: Date.now()
  });

  // Limit to 100 items
  if (history.length > 100) {
    history.pop();
  }

  saveHistory(history);
  return history;
}

export function removeFromHistory(character) {
  const history = getHistory();
  const newHistory = history.filter(item => item.character !== character);
  saveHistory(newHistory);
  return newHistory;
}

export function clearHistory() {
  saveHistory([]);
  return [];
}
