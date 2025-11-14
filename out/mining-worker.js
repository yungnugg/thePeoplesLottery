/**
 * Bitcoin Mining Web Worker
 * Performs SHA-256 double hashing in a separate thread to avoid blocking the UI
 */

// Simple SHA-256 implementation for the worker
class WorkerSHA256 {
  static async hash(data) {
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

  static async doubleSha256(data) {
    const firstHash = await WorkerSHA256.hash(data);
    const secondData = new ArrayBuffer(firstHash.byteLength);
    new Uint8Array(secondData).set(firstHash);
    return WorkerSHA256.hash(secondData);
  }

  static bytesToHex(bytes) {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  static hexToArrayBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
  }
}

class WorkerMiner {
  static createBlockHeader(difficulty, nonce) {
    const timestamp = Math.floor(Date.now() / 1000);
    
    return {
      version: 0x20000000,
      previousBlockHash: '0'.repeat(64),
      merkleRoot: '0'.repeat(64),
      timestamp,
      bits: 0x1d00ffff,
      nonce,
    };
  }

  static serializeBlockHeader(header) {
    const buffer = new ArrayBuffer(80);
    const view = new DataView(buffer);
    
    let offset = 0;
    
    // Version (4 bytes, little-endian)
    view.setUint32(offset, header.version, true);
    offset += 4;
    
    // Previous block hash (32 bytes, little-endian)
    const prevHashBytes = WorkerSHA256.hexToArrayBuffer(header.previousBlockHash);
    new Uint8Array(buffer, offset, 32).set(new Uint8Array(prevHashBytes).reverse());
    offset += 32;
    
    // Merkle root (32 bytes, little-endian)
    const merkleBytes = WorkerSHA256.hexToArrayBuffer(header.merkleRoot);
    new Uint8Array(buffer, offset, 32).set(new Uint8Array(merkleBytes).reverse());
    offset += 32;
    
    // Timestamp (4 bytes, little-endian)
    view.setUint32(offset, header.timestamp, true);
    offset += 4;
    
    // Bits (4 bytes, little-endian)
    view.setUint32(offset, header.bits, true);
    offset += 4;
    
    // Nonce (4 bytes, little-endian)
    view.setUint32(offset, header.nonce, true);
    
    return buffer;
  }

  static isValidHash(hash, target) {
    const hashHex = WorkerSHA256.bytesToHex(hash);
    const hashBigInt = BigInt('0x' + hashHex);
    const targetBigInt = BigInt('0x' + target);
    
    return hashBigInt < targetBigInt;
  }

  static async mineBlock(difficulty, nonce) {
    const blockHeader = WorkerMiner.createBlockHeader(difficulty, nonce);
    const headerData = WorkerMiner.serializeBlockHeader(blockHeader);
    
    const hash = await WorkerSHA256.doubleSha256(headerData);
    const hashHex = WorkerSHA256.bytesToHex(hash);
    
    const isWinner = WorkerMiner.isValidHash(hash, difficulty.target);
    
    return {
      hash: hashHex,
      nonce: nonce,
      isWinner,
      attempts: 1,
      timestamp: Date.now(),
    };
  }
}

// Worker message handler
self.onmessage = async function(e) {
  const { type, data } = e.data;
  
  try {
    switch (type) {
      case 'MINE_BATCH':
        const { difficulty, attemptCount, startNonce } = data;
        const results = [];
        
        for (let i = 0; i < attemptCount; i++) {
          const result = await WorkerMiner.mineBlock(difficulty, startNonce + i);
          results.push(result);
          
          // Send progress updates every 100 attempts
          if (i % 100 === 0) {
            self.postMessage({
              type: 'PROGRESS',
              data: {
                completed: i + 1,
                total: attemptCount,
                results: results.slice(-1), // Send latest result
              }
            });
          }
          
          // If we find a winner, stop and return immediately
          if (result.isWinner) {
            self.postMessage({
              type: 'WINNER_FOUND',
              data: {
                winner: result,
                totalAttempts: i + 1,
                allResults: results,
              }
            });
            return;
          }
        }
        
        // No winner found, return all results
        self.postMessage({
          type: 'MINING_COMPLETE',
          data: {
            results,
            totalAttempts: attemptCount,
            winner: null,
          }
        });
        break;
        
      case 'MINE_SINGLE':
        const singleResult = await WorkerMiner.mineBlock(data.difficulty, data.nonce);
        self.postMessage({
          type: 'SINGLE_RESULT',
          data: singleResult,
        });
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      data: {
        message: error.message,
        stack: error.stack,
      }
    });
  }
};