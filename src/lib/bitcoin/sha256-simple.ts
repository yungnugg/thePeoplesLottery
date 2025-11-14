/**
 * Simplified SHA-256 implementation for Bitcoin mining
 * Uses Web Crypto API for performance
 */

export class SHA256 {
  /**
   * Hash data using Web Crypto API
   */
  static async hash(data: ArrayBuffer): Promise<Uint8Array> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return new Uint8Array(hashBuffer);
      } catch {
        throw new Error('SHA-256 hashing failed');
      }
    }
    throw new Error('Web Crypto API not available');
  }

  /**
   * Perform Bitcoin double SHA-256 hash
   */
  static async doubleSha256(data: ArrayBuffer): Promise<Uint8Array> {
    const firstHash = await SHA256.hash(data);
    const secondData = new ArrayBuffer(firstHash.byteLength);
    new Uint8Array(secondData).set(firstHash);
    return SHA256.hash(secondData);
  }

  /**
   * Convert hex string to ArrayBuffer
   */
  static hexToArrayBuffer(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
  }

  /**
   * Convert Uint8Array to hex string
   */
  static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert number to little-endian 32-bit ArrayBuffer
   */
  static numberToLE32(num: number): ArrayBuffer {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, num, true); // true = little endian
    return buffer;
  }

  /**
   * Concatenate ArrayBuffers
   */
  static concatBuffers(...buffers: ArrayBuffer[]): ArrayBuffer {
    const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const buffer of buffers) {
      result.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }
    
    return result.buffer;
  }
}