export interface ChatAudioFrame {
  sequence: number;
  blockId: number;
  chunkId: number;
  operationId: string;
  messageId: string;
  complete: boolean;
  samples: Float32Array;
  sampleRate: number;
}

function uuid(view: DataView, offset: number): string {
  const hex = Array.from({ length: 16 }, (_, index) =>
    view
      .getUint8(offset + index)
      .toString(16)
      .padStart(2, "0"),
  ).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

/** Arcade v1: 8-byte envelope, 40-byte chat header, little-endian PCM16 at 32 kHz. */
export function decodeChatAudioFrame(data: ArrayBuffer): ChatAudioFrame | null {
  if (data.byteLength < 48 || (data.byteLength - 48) % 2 !== 0) return null;
  const view = new DataView(data);
  if (view.getUint8(0) !== 1 || view.getUint8(1) !== 1) return null;
  const samples = new Float32Array((data.byteLength - 48) / 2);
  for (let index = 0; index < samples.length; index++)
    samples[index] = view.getInt16(48 + index * 2, true) / 32768;
  return {
    sequence: view.getUint32(4, true),
    blockId: view.getUint32(8, true),
    chunkId: view.getUint32(12, true),
    operationId: uuid(view, 16),
    messageId: uuid(view, 32),
    complete: !!(view.getUint16(2, true) & 1),
    samples,
    sampleRate: 32000,
  };
}

/** Sanitization matches chat.playerMessage; count Unicode code points as the Python reducer does. */
export function sanitizeChatText(text: string): string {
  return [
    ...text
      .replace(/[\r\n\x00-\x1f\x7f\u2028\u2029]/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  ]
    .slice(0, 100)
    .join("");
}
