import { NetworkDifficulty } from './types';

/**
 * Bitcoin network difficulty and probability calculations
 */
export class DifficultyCalculator {
  // Current Bitcoin network difficulty (approximate, would be fetched from API in production)
  private static readonly CURRENT_DIFFICULTY = 62463471666732.66;
  
  // Maximum target value (difficulty 1)
  private static readonly MAX_TARGET = BigInt('0x00000000FFFF0000000000000000000000000000000000000000000000000000');

  /**
   * Get current Bitcoin network difficulty data
   * In production, this would fetch from a Bitcoin API
   */
  static getCurrentDifficulty(): NetworkDifficulty {
    const difficulty = DifficultyCalculator.CURRENT_DIFFICULTY;
    const target = DifficultyCalculator.calculateTarget(difficulty);
    
    return {
      difficulty,
      target,
      hashRate: 500000000000000000, // ~500 EH/s (approximate current network hashrate)
      blockHeight: 850000, // Approximate current block height
    };
  }

  /**
   * Calculate target hash from difficulty
   */
  static calculateTarget(difficulty: number): string {
    const target = DifficultyCalculator.MAX_TARGET / BigInt(Math.floor(difficulty));
    return target.toString(16).padStart(64, '0');
  }

  /**
   * Calculate mining probability
   */
  static calculateMiningProbability(attempts: number, difficulty: number = DifficultyCalculator.CURRENT_DIFFICULTY) {
    // Probability of finding a valid hash in one attempt
    const singleAttemptProbability = 1 / difficulty;
    
    // Probability of NOT finding a valid hash in one attempt
    const failureProbability = 1 - singleAttemptProbability;
    
    // Probability of NOT finding a valid hash in N attempts
    const totalFailureProbability = Math.pow(failureProbability, attempts);
    
    // Probability of finding at least one valid hash in N attempts
    const successProbability = 1 - totalFailureProbability;
    
    return {
      perAttempt: singleAttemptProbability,
      afterNAttempts: successProbability,
      oneIn: Math.floor(1 / singleAttemptProbability),
      scientific: singleAttemptProbability.toExponential(2),
    };
  }

  /**
   * Calculate expected time to find a block
   */
  static calculateExpectedTime(hashRate: number, difficulty: number = DifficultyCalculator.CURRENT_DIFFICULTY) {
    // Expected number of hashes needed
    const expectedHashes = difficulty * Math.pow(2, 32);
    
    // Expected time in seconds
    const expectedSeconds = expectedHashes / hashRate;
    
    return {
      seconds: expectedSeconds,
      minutes: expectedSeconds / 60,
      hours: expectedSeconds / 3600,
      days: expectedSeconds / (3600 * 24),
      years: expectedSeconds / (3600 * 24 * 365.25),
    };
  }

  /**
   * Format probability for display
   */
  static formatProbability(probability: number): string {
    if (probability === 0) return '0%';
    if (probability >= 0.01) return `${(probability * 100).toFixed(2)}%`;
    if (probability >= 0.0001) return `${(probability * 100).toFixed(4)}%`;
    
    // For very small probabilities, use scientific notation
    return `${(probability * 100).toExponential(2)}%`;
  }

  /**
   * Format large numbers with appropriate units
   */
  static formatHashRate(hashRate: number): string {
    const units = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s'];
    let unitIndex = 0;
    let value = hashRate;
    
    while (value >= 1000 && unitIndex < units.length - 1) {
      value /= 1000;
      unitIndex++;
    }
    
    return `${value.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Get odds formatted as "1 in X"
   */
  static formatOdds(probability: number): string {
    if (probability === 0) return '1 in ∞';
    
    const oneIn = Math.floor(1 / probability);
    
    if (oneIn < 1000) return `1 in ${oneIn}`;
    if (oneIn < 1000000) return `1 in ${(oneIn / 1000).toFixed(1)}K`;
    if (oneIn < 1000000000) return `1 in ${(oneIn / 1000000).toFixed(1)}M`;
    if (oneIn < 1000000000000) return `1 in ${(oneIn / 1000000000).toFixed(1)}B`;
    if (oneIn < 1000000000000000) return `1 in ${(oneIn / 1000000000000).toFixed(1)}T`;
    
    return `1 in ${oneIn.toExponential(2)}`;
  }

  /**
   * Simulate realistic browser mining hashrate
   */
  static getBrowserHashRate(): number {
    // Realistic browser mining hashrate (very slow compared to ASIC miners)
    // Approximately 1000-10000 hashes per second in a modern browser
    return Math.floor(Math.random() * 9000) + 1000; // 1K-10K H/s
  }
}