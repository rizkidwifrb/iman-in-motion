const VALID_MODES = new Set(['chat', 'voice']);

function validateChatPayload(body = {}) {
  const message = String(body.message || '').trim().slice(0, 2000);
  if (!message) {
    return { ok: false, error: 'Pesan kosong.' };
  }

  const history = Array.isArray(body.history)
    ? body.history.slice(-12).map((item) => ({
        role: item?.role === 'assistant' ? 'assistant' : 'user',
        content: String(item?.content || '').slice(0, 1000)
      })).filter((item) => item.content.trim())
    : [];

  const mode = VALID_MODES.has(body.mode) ? body.mode : 'chat';
  return {
    ok: true,
    value: {
      message,
      history,
      mode
    }
  };
}

function safeString(value, fallback = '', maxLength = 500) {
  const next = String(value ?? fallback).trim();
  return next.slice(0, maxLength);
}

function safeInteger(value, fallback = 10, min = 1, max = 50) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

module.exports = {
  validateChatPayload,
  safeString,
  safeInteger
};
