const ENC_PREFIX = 'ENC::';

async function deriveKey(passphrase) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('jjtest-chat-salt'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(text, passphrase) {
  if (!passphrase || !text) return text;
  const key = await deriveKey(passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text)
  );
  const combined = new Uint8Array(iv.length + cipherBuf.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(cipherBuf), iv.length);
  return ENC_PREFIX + btoa(String.fromCharCode(...combined));
}

export async function decrypt(ciphertext, passphrase) {
  if (!passphrase || !ciphertext || !ciphertext.startsWith(ENC_PREFIX)) return ciphertext;
  try {
    const key = await deriveKey(passphrase);
    const raw = atob(ciphertext.slice(ENC_PREFIX.length));
    const bytes = new Uint8Array([...raw].map(c => c.charCodeAt(0)));
    const iv = bytes.slice(0, 12);
    const data = bytes.slice(12);
    const decBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(decBuf);
  } catch {
    return null;
  }
}

export function isEncrypted(text) {
  return typeof text === 'string' && text.startsWith(ENC_PREFIX);
}
