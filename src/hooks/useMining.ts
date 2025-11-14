import { useEffect, useCallback } from 'react';
import { useMiningStore } from '@/stores/miningStore';
import { DifficultyCalculator } from '@/lib/bitcoin/difficulty';

/**
 * Custom hook for Bitcoin mining operations
 */
export function useMining() {
  const {
    // State
    isMining,
    isConnected,
    totalAttempts,
    totalHashes,
    hashRate,
    results,
    winners,
    latestResult,
    difficulty,
    probability,
    progress,
    error,
    showWinnerModal,
    latestWinner,
    
    // Actions
    initializeWorker,
    terminateWorker,
    startMining,
    stopMining,
    updateDifficulty,
    updateHashRate,
    hideWinnerModal,
    clearError,
    reset,
  } = useMiningStore();

  // Initialize worker on mount
  useEffect(() => {
    initializeWorker();
    
    // Load current difficulty
    const currentDifficulty = DifficultyCalculator.getCurrentDifficulty();
    updateDifficulty(currentDifficulty);
    
    // Estimate browser hash rate
    const browserHashRate = DifficultyCalculator.getBrowserHashRate();
    updateHashRate(browserHashRate);
    
    return () => {
      terminateWorker();
    };
  }, [initializeWorker, terminateWorker, updateDifficulty, updateHashRate]);

  // Mine with default 1000 attempts
  const mine = useCallback(async (attempts: number = 1000) => {
    if (!isConnected) {
      throw new Error('Mining worker not connected');
    }
    
    await startMining(attempts);
  }, [isConnected, startMining]);

  // Calculate current mining statistics
  const stats = {
    totalAttempts,
    totalHashes,
    hashRate,
    probability: probability ? {
      perAttempt: DifficultyCalculator.formatProbability(probability.perAttempt),
      total: DifficultyCalculator.formatProbability(probability.total),
      odds: DifficultyCalculator.formatOdds(probability.perAttempt),
    } : null,
    winners: winners.length,
    isRunning: isMining,
  };

  // Get current network info
  const networkInfo = difficulty ? {
    difficulty: difficulty.difficulty.toLocaleString(),
    hashRate: DifficultyCalculator.formatHashRate(difficulty.hashRate),
    blockHeight: difficulty.blockHeight.toLocaleString(),
    target: difficulty.target,
  } : null;

  return {
    // State
    isMining,
    isConnected,
    stats,
    networkInfo,
    results,
    winners,
    latestResult,
    progress,
    error,
    showWinnerModal,
    latestWinner,
    
    // Actions
    mine,
    stopMining,
    hideWinnerModal,
    clearError,
    reset,
  };
}

/**
 * Hook for difficulty updates
 */
export function useDifficulty() {
  const { difficulty, updateDifficulty } = useMiningStore();

  const refreshDifficulty = useCallback(() => {
    const currentDifficulty = DifficultyCalculator.getCurrentDifficulty();
    updateDifficulty(currentDifficulty);
    return currentDifficulty;
  }, [updateDifficulty]);

  // Auto-refresh difficulty every 10 minutes (Bitcoin blocks are ~10 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshDifficulty();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [refreshDifficulty]);

  return {
    difficulty,
    refreshDifficulty,
  };
}