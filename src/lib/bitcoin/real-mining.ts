import { SHA256 } from './sha256-simple';
import { BlockHeader, MiningResult, NetworkDifficulty } from './types';

/**
 * REAL Bitcoin mining implementation 
 * Connects to actual Bitcoin network and attempts real mining
 * MAGNIFICENTLY INEFFICIENT BY DESIGN
 */
export class RealBitcoinMiner {
  private static readonly BITCOIN_ADDRESS = 'bc1qwykm65ww56yax302sezngucwlr9ryr3upk7n3r';
  private static readonly BITCOIN_API_BASE = 'https://blockstream.info/api';
  private static readonly MEMPOOL_API = 'https://mempool.space/api/v1';

  /**
   * Fetch REAL Bitcoin network data (live!)
   */
  static async fetchRealNetworkData(): Promise<NetworkDifficulty> {
    try {
      // Get current block height and difficulty from real Bitcoin network
      const [statsResponse, blocksResponse] = await Promise.all([
        fetch(`${RealBitcoinMiner.MEMPOOL_API}/difficulty-adjustment`),
        fetch(`${RealBitcoinMiner.MEMPOOL_API}/blocks/tip/height`)
      ]);

      const stats = await statsResponse.json();
      const currentHeight = await blocksResponse.json();

      // Get current difficulty (this is REAL and MASSIVE)
      const difficulty = stats.difficultyChange || 62463471666732.66;
      
      // Calculate target from real difficulty
      const maxTarget = BigInt('0x00000000FFFF0000000000000000000000000000000000000000000000000000');
      const target = (maxTarget / BigInt(Math.floor(difficulty))).toString(16).padStart(64, '0');

      return {
        difficulty,
        target,
        hashRate: 500000000000000000, // ~500 EH/s real network hashrate
        blockHeight: currentHeight,
      };
    } catch (error) {
      console.warn('Failed to fetch real Bitcoin data, using fallback:', error);
      // Fallback to known values
      return {
        difficulty: 62463471666732.66,
        target: '00000000000000000000ffff0000000000000000000000000000000000000000',
        hashRate: 500000000000000000,
        blockHeight: 850000,
      };
    }
  }

  /**
   * Fetch REAL pending transactions from Bitcoin mempool
   */
  static async fetchRealTransactions(): Promise<string[]> {
    try {
      const response = await fetch(`${RealBitcoinMiner.MEMPOOL_API}/mempool/recent`);
      const transactions = await response.json();
      
      // Return array of transaction IDs for building real blocks
      return transactions.slice(0, 1000).map((tx: any) => tx.txid);
    } catch (error) {
      console.warn('Failed to fetch real transactions:', error);
      // Return some realistic looking transaction IDs
      return Array.from({ length: 100 }, (_, i) => 
        'a'.repeat(32) + i.toString().padStart(32, '0')
      );
    }
  }

  /**
   * Build REAL Bitcoin block header with actual network data
   */
  static async createRealBlockHeader(difficulty: NetworkDifficulty, nonce: number): Promise<BlockHeader> {
    try {
      // Get the latest block hash (real!)
      const latestBlockResponse = await fetch(`${RealBitcoinMiner.BITCOIN_API_BASE}/blocks/tip/hash`);
      const previousBlockHash = await latestBlockResponse.text();

      // Get real transactions to build merkle root
      const transactions = await RealBitcoinMiner.fetchRealTransactions();
      
      // Calculate merkle root from real transactions (simplified)
      const merkleRoot = await RealBitcoinMiner.calculateMerkleRoot(transactions);
      
      return {
        version: 0x20000000, // Real Bitcoin version
        previousBlockHash: previousBlockHash.replace(/[^0-9a-f]/gi, ''), // Clean hash
        merkleRoot,
        timestamp: Math.floor(Date.now() / 1000), // Current Unix timestamp
        bits: RealBitcoinMiner.difficultyToBits(difficulty.difficulty), // Real difficulty bits
        nonce,
      };
    } catch (error) {
      console.warn('Failed to create real block header:', error);
      // Fallback to realistic values
      return {
        version: 0x20000000,
        previousBlockHash: '0'.repeat(64),
        merkleRoot: 'f'.repeat(64),
        timestamp: Math.floor(Date.now() / 1000),
        bits: 0x1d00ffff,
        nonce,
      };
    }
  }

  /**
   * Calculate merkle root from real transaction IDs
   */
  static async calculateMerkleRoot(txids: string[]): Promise<string> {
    if (txids.length === 0) return 'f'.repeat(64);
    if (txids.length === 1) return txids[0]!;

    // Simplified merkle root calculation (in real Bitcoin this is more complex)
    let level = txids;
    while (level.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i]!;
        const right = level[i + 1] || left; // Duplicate if odd number
        
        // Hash the concatenation
        const combined = SHA256.hexToArrayBuffer(left + right);
        const hash = await SHA256.hash(combined);
        nextLevel.push(SHA256.bytesToHex(hash));
      }
      level = nextLevel;
    }
    
    return level[0] || 'f'.repeat(64);
  }

  /**
   * Convert difficulty to bits format (real Bitcoin encoding)
   */
  static difficultyToBits(difficulty: number): number {
    // Simplified bits calculation - in real Bitcoin this is more complex
    const target = BigInt('0x00000000FFFF0000000000000000000000000000000000000000000000000000') / BigInt(Math.floor(difficulty));
    
    // Convert to compact format (this is a simplification)
    return 0x1d00ffff; // Placeholder - real calculation is complex
  }

  /**
   * Mine REAL Bitcoin block (actually trying to solve Bitcoin!)
   */
  static async mineRealBlock(difficulty: NetworkDifficulty, nonce: number): Promise<MiningResult> {
    // Create REAL block header with live network data
    const blockHeader = await RealBitcoinMiner.createRealBlockHeader(difficulty, nonce);
    const headerData = RealBitcoinMiner.serializeBlockHeader(blockHeader);
    
    // Perform REAL double SHA-256 hash (same as Bitcoin network!)
    const hash = await SHA256.doubleSha256(headerData);
    const hashHex = SHA256.bytesToHex(hash);
    
    // Check against REAL Bitcoin difficulty target
    const isWinner = RealBitcoinMiner.isValidHash(hash, difficulty.target);
    
    if (isWinner) {
      console.log('🎉 HOLY SHIT WE ACTUALLY FOUND A VALID BITCOIN BLOCK! 🎉');
      console.log('Hash:', hashHex);
      console.log('Nonce:', nonce);
      
      // In theory, we could submit this to the Bitcoin network...
      // But that would require a full node connection
      await RealBitcoinMiner.celebrateImpossibleVictory(hashHex, nonce);
    }
    
    return {
      hash: hashHex,
      nonce,
      isWinner,
      attempts: 1,
      timestamp: Date.now(),
    };
  }

  /**
   * Serialize block header exactly like Bitcoin Core
   */
  static serializeBlockHeader(header: BlockHeader): ArrayBuffer {
    const buffer = new ArrayBuffer(80);
    const view = new DataView(buffer);
    
    let offset = 0;
    
    // Version (4 bytes, little-endian)
    view.setUint32(offset, header.version, true);
    offset += 4;
    
    // Previous block hash (32 bytes, reversed because Bitcoin is weird)
    const prevHashBytes = SHA256.hexToArrayBuffer(header.previousBlockHash);
    new Uint8Array(buffer, offset, 32).set(new Uint8Array(prevHashBytes).reverse());
    offset += 32;
    
    // Merkle root (32 bytes, reversed)
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
   * Check if hash meets REAL Bitcoin difficulty
   */
  static isValidHash(hash: Uint8Array, target: string): boolean {
    const hashHex = SHA256.bytesToHex(hash);
    const hashBigInt = BigInt('0x' + hashHex);
    const targetBigInt = BigInt('0x' + target);
    
    return hashBigInt < targetBigInt;
  }

  /**
   * Celebrate the impossible (finding a valid block)
   */
  static async celebrateImpossibleVictory(hash: string, nonce: number): Promise<void> {
    console.log('🚨 ALERT: BROWSER JUST MINED A REAL BITCOIN BLOCK! 🚨');
    console.log('This is literally impossible but it happened!');
    console.log('Hash:', hash);
    console.log('Nonce:', nonce);
    console.log('Send Bitcoin to:', RealBitcoinMiner.BITCOIN_ADDRESS);
    
    // TODO: Send notification to Firebase
    // TODO: Submit block to Bitcoin network (if we had a full node)
    // TODO: Alert the media that a browser just out-mined ASICs
  }

  /**
   * Calculate the ABSURD probability of success
   */
  static calculateAbsurdProbability(attempts: number, difficulty: number) {
    const singleAttemptProbability = 1 / difficulty;
    const totalProbability = 1 - Math.pow(1 - singleAttemptProbability, attempts);
    
    // Calculate ridiculous time estimates
    const browserHashRate = 10000; // ~10K H/s in browser
    const networkHashRate = 500000000000000000; // ~500 EH/s
    const expectedHashes = difficulty * Math.pow(2, 32);
    const expectedYears = expectedHashes / (browserHashRate * 31536000); // seconds per year
    
    return {
      perAttempt: singleAttemptProbability,
      total: totalProbability,
      oneIn: Math.floor(1 / singleAttemptProbability),
      expectedYears,
      comparedToNetwork: networkHashRate / browserHashRate, // How much slower we are
      absurdityLevel: 'MAXIMUM',
    };
  }

  /**
   * Get winner address for the lucky soul
   */
  static getWinnerAddress(): string {
    return RealBitcoinMiner.BITCOIN_ADDRESS + '?message=Winner!%20(Lottery%20project)';
  }
}