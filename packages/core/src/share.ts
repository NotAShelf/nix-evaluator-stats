import LZUTF8 from 'lzutf8';

export type ShareState =
  | { type: 'analysis'; data: Record<string, unknown>; name: string }
  | {
      type: 'compare';
      left: Record<string, unknown>;
      right: Record<string, unknown>;
      leftName: string;
      rightName: string;
    };

export function encodeShareUrl(state: ShareState): string {
  const json = JSON.stringify(state);
  const encoded = LZUTF8.compress(json, { outputEncoding: 'Base64' }) as string;
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodeShareUrl(encoded: string): ShareState | null {
  try {
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (base64.length % 4)) % 4;
    base64 += '='.repeat(padLength);
    const json = LZUTF8.decompress(base64, {
      inputEncoding: 'Base64',
      outputEncoding: 'String',
    }) as string | null;
    if (!json) {
      return null;
    }
    const state = JSON.parse(json) as ShareState;
    if (state.type === 'analysis') {
      if (!state.data || !state.name) {
        return null;
      }
    } else if (state.type === 'compare') {
      if (!state.left || !state.right || !state.leftName || !state.rightName) {
        return null;
      }
    } else {
      return null;
    }
    return state;
  } catch {
    return null;
  }
}
