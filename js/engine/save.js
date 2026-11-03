// Auto-save to the device. Storage can be blocked (private mode etc.), so every
// access is guarded and the game simply plays on without saving.
const KEY = 'dracula-castle-save-v1';

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function write(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage unavailable */ }
}

export function clear() {
  try { localStorage.removeItem(KEY); } catch (e) { /* storage unavailable */ }
}
