import { SHA256 } from './sha256-simple';
import { BlockHeader, MiningResult, NetworkDifficulty } from './types';

/**
 * Bitcoin mining implementation
 * Performs actual SHA-256 double hashing on block headers
 */
export class BitcoinMiner {
  private static readonly BITCOIN_ADDRESS = 'bc1qwykm65ww56yax302sezngucwlr9ryr3upk7n3r';

  /**
   * Create a Bitcoin block header from current network data
   */
  static createBlockHeader(difficulty: NetworkDifficulty, nonce: number): BlockHeader {
    // Use current timestamp
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Placeholder values - in production these would come from Bitcoin network
    const blockHeader: BlockHeader = {
      version: 0x20000000,
      previousBlockHash: '0'.repeat(64), // Would be actual previous block hash
      merkleRoot: '0'.repeat(64), // Would be actual merkle root of transactions
      timestamp,
      bits: 0x1d00ffff, // Difficulty target in compact format
      nonce,
    };

    return blockHeader;
  }

  /**
   * Serialize block header to binary format for hashing
   */
  static serializeBlockHeader(header: BlockHeader): ArrayBuffer {
    const buffer = new ArrayBuffer(80); // Bitcoin block header is 80 bytes
    const view = new DataView(buffer);
    
    let offset = 0;
    
    // Version (4 bytes, little-endian)
    view.setUint32(offset, header.version, true);
    offset += 4;
    
    // Previous block hash (32 bytes, little-endian)
    const prevHashBytes = SHA256.hexToArrayBuffer(header.previousBlockHash);
    new Uint8Array(buffer, offset, 32).set(new Uint8Array(prevHashBytes).reverse());
    offset += 32;
    
    // Merkle root (32 bytes, little-endian)
    const merkleBytes = SHA256.hexToArrayBuffer(header.merkleRoot);
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

  /**
   * Check if hash meets difficulty target
   */
  static isValidHash(hash: Uint8Array, target: string): boolean {
    const hashHex = SHA256.bytesToHex(hash);
    const hashBigInt = BigInt('0x' + hashHex);
    const targetBigInt = BigInt('0x' + target);
    
    return hashBigInt < targetBigInt;
  }

  /**
   * Mine a single block attempt
   */
  static async mineBlock(
    difficulty: NetworkDifficulty,
    startNonce: number
  ): Promise<MiningResult> {
    const blockHeader = BitcoinMiner.createBlockHeader(difficulty, startNonce);
    const headerData = BitcoinMiner.serializeBlockHeader(blockHeader);
    
    // Perform double SHA-256 hash
    const hash = await SHA256.doubleSha256(headerData);
    const hashHex = SHA256.bytesToHex(hash);
    
    // Check if this is a winning hash
    const isWinner = BitcoinMiner.isValidHash(hash, difficulty.target);
    
    return {
      hash: hashHex,
      nonce: startNonce,
      isWinner,
      attempts: 1,
      timestamp: Date.now(),
    };
  }

  /**
   * Mine multiple attempts (batch mining)
   */
  static async mineBatch(
    difficulty: NetworkDifficulty,
    attemptCount: number = 1000,
    startNonce: number = 0
  ): Promise<MiningResult[]> {
    const results: MiningResult[] = [];
    
    for (let i = 0; i < attemptCount; i++) {
      const result = await BitcoinMiner.mineBlock(difficulty, startNonce + i);
      results.push(result);
      
      // If we find a winner, return immediately
      if (result.isWinner) {
        break;
      }
    }
    
    return results;
  }

  /**
   * Calculate probability of mining success
   */
  static calculateProbability(
    attempts: number,
    difficulty: number
  ): { perAttempt: number; total: number; oneIn: number } {
    // Bitcoin difficulty represents the ratio of maximum target to current target
    // Probability per attempt is approximately 1 / (difficulty * 2^32)
    const maxTarget = BigInt('0x00000000FFFF0000000000000000000000000000000000000000000000000000');
    const currentTarget = maxTarget / BigInt(Math.floor(difficulty));
    
    const perAttempt = Number(currentTarget) / Number(maxTarget);
    const total = 1 - Math.pow(1 - perAttempt, attempts);
    const oneIn = Math.floor(1 / perAttempt);
    
    return {
      perAttempt,
      total,
      oneIn,
    };
  }

  /**
   * Get the Bitcoin address for winners
   */
  static getWinnerAddress(): string {
    return BitcoinMiner.BITCOIN_ADDRESS;
  }
}