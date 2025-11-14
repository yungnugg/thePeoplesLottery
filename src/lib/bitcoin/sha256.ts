/**
 * SHA-256 implementation for Bitcoin mining
 * Uses Web Crypto API for hardware acceleration when available
 */

export class SHA256 {
  private static readonly K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  private static rotr(n: number, x: number): number {
    return (x >>> n) | (x << (32 - n));
  }

  private static ch(x: number, y: number, z: number): number {
    return (x & y) ^ (~x & z);
  }

  private static maj(x: number, y: number, z: number): number {
    return (x & y) ^ (x & z) ^ (y & z);
  }

  private static sigma0(x: number): number {
    return SHA256.rotr(2, x) ^ SHA256.rotr(13, x) ^ SHA256.rotr(22, x);
  }

  private static sigma1(x: number): number {
    return SHA256.rotr(6, x) ^ SHA256.rotr(11, x) ^ SHA256.rotr(25, x);
  }

  private static gamma0(x: number): number {
    return SHA256.rotr(7, x) ^ SHA256.rotr(18, x) ^ (x >>> 3);
  }

  private static gamma1(x: number): number {
    return SHA256.rotr(17, x) ^ SHA256.rotr(19, x) ^ (x >>> 10);
  }

  /**
   * Hash data using pure JavaScript implementation
   */
  static hashSync(data: Uint8Array): Uint8Array {
    const h: number[] = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ];

    const msgLen = data.length;
    const blockCount = Math.ceil((msgLen + 9) / 64);
    const totalLen = blockCount * 64;
    const msg = new Uint8Array(totalLen);
    msg.set(data);
    msg[msgLen] = 0x80;

    for (let i = msgLen + 1; i < totalLen - 8; i++) {
      msg[i] = 0;
    }

    const view = new DataView(msg.buffer);
    view.setBigUint64(totalLen - 8, BigInt(msgLen * 8), false);

    for (let i = 0; i < blockCount; i++) {
      const w = new Array(64);
      
      for (let j = 0; j < 16; j++) {
        w[j] = view.getUint32(i * 64 + j * 4, false);
      }

      for (let j = 16; j < 64; j++) {
        w[j] = (SHA256.gamma1(w[j - 2]) + w[j - 7] + SHA256.gamma0(w[j - 15]) + w[j - 16]) >>> 0;
      }

      const [a0, b0, c0, d0, e0, f0, g0, h0] = h as [number, number, number, number, number, number, number, number];
      let a = a0, b = b0, c = c0, d = d0, e = e0, f = f0, g = g0, h_val = h0;

      for (let j = 0; j < 64; j++) {
        const t1 = (h_val + SHA256.sigma1(e) + SHA256.ch(e, f, g) + SHA256.K[j]! + w[j]!) >>> 0;
        const t2 = (SHA256.sigma0(a) + SHA256.maj(a, b, c)) >>> 0;
        h_val = g;
        g = f;
        f = e;
        e = (d + t1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (t1 + t2) >>> 0;
      }

      h[0] = (h[0]! + a) >>> 0;
      h[1] = (h[1]! + b) >>> 0;
      h[2] = (h[2]! + c) >>> 0;
      h[3] = (h[3]! + d) >>> 0;
      h[4] = (h[4]! + e) >>> 0;
      h[5] = (h[5]! + f) >>> 0;
      h[6] = (h[6]! + g) >>> 0;
      h[7] = (h[7]! + h_val) >>> 0;
    }

    const result = new Uint8Array(32);
    const resultView = new DataView(result.buffer);
    
    for (let i = 0; i < 8; i++) {
      resultView.setUint32(i * 4, h[i]!, false);
    }

    return result;
  }

  /**
   * Hash data using Web Crypto API (faster, hardware accelerated)
   */
  static async hash(data: Uint8Array): Promise<Uint8Array> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data as any);
        return new Uint8Array(hashBuffer);
      } catch {
        // Fallback to sync implementation
      }
    }
    return SHA256.hashSync(data);
  }

  /**
   * Perform Bitcoin double SHA-256 hash
   */
  static async doubleSha256(data: Uint8Array): Promise<Uint8Array> {
    const firstHash = await SHA256.hash(data);
    return SHA256.hash(firstHash);
  }

  /**
   * Synchronous double SHA-256 for mining workers
   */
  static doubleSha256Sync(data: Uint8Array): Uint8Array {
    const firstHash = SHA256.hashSync(data);
    return SHA256.hashSync(firstHash);
  }
}