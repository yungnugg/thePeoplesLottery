import { create } from 'zustand';
import { MiningResult, NetworkDifficulty, Winner } from '@/lib/bitcoin/types';

interface MiningState {
  // Mining status
  isMining: boolean;
  isConnected: boolean;
  worker: Worker | null;
  
  // Mining statistics
  totalAttempts: number;
  totalHashes: number;
  hashRate: number;
  startTime: number | null;
  
  // Results
  results: MiningResult[];
  winners: Winner[];
  latestResult: MiningResult | null;
  
  // Network data
  difficulty: NetworkDifficulty | null;
  probability: {
    perAttempt: number;
    total: number;
    oneIn: number;
    formatted: string;
  } | null;
  
  // UI state
  showWinnerModal: boolean;
  latestWinner: Winner | null;
  progress: {
    current: number;
    total: number;
    percentage: number;
  } | null;
  
  // Error handling
  error: string | null;
  lastError: Error | null;
}

interface MiningActions {
  // Worker management
  initializeWorker: () => void;
  terminateWorker: () => void;
  
  // Mining operations
  startMining: (attemptCount?: number) => Promise<void>;
  stopMining: () => void;
  
  // State updates
  updateDifficulty: (difficulty: NetworkDifficulty) => void;
  addResult: (result: MiningResult) => void;
  addWinner: (winner: Winner) => void;
  updateProgress: (current: number, total: number) => void;
  updateHashRate: (hashRate: number) => void;
  
  // UI actions
  showWinner: (winner: Winner) => void;
  hideWinnerModal: () => void;
  clearError: () => void;
  
  // Reset
  reset: () => void;
}

const initialState: MiningState = {
  isMining: false,
  isConnected: false,
  worker: null,
  totalAttempts: 0,
  totalHashes: 0,
  hashRate: 0,
  startTime: null,
  results: [],
  winners: [],
  latestResult: null,
  difficulty: null,
  probability: null,
  showWinnerModal: false,
  latestWinner: null,
  progress: null,
  error: null,
  lastError: null,
};

export const useMiningStore = create<MiningState & MiningActions>((set, get) => ({
  ...initialState,

  initializeWorker: () => {
    const state = get();
    if (state.worker) {
      state.worker.terminate();
    }

    try {
      const worker = new Worker('/mining-worker.js');
      
      worker.onmessage = (e) => {
        const { type, message, jobId, hashes, total, hash, nonce, totalHashes } = e.data;
        
        switch (type) {
          case 'connected':
            console.log('✅ Connected to Stratum mining pool');
            set({ isConnected: true, error: null });
            break;

          case 'job':
            console.log(`📋 New mining job: ${jobId}`);
            break;

          case 'started':
            console.log(`⛏️ Mining started on job: ${jobId}`);
            set({ isMining: true, startTime: Date.now(), progress: { current: 0, total: 100000, percentage: 0 } });
            break;

          case 'progress':
            set((state) => ({
              progress: {
                current: hashes,
                total: 100000,
                percentage: (hashes / 100000) * 100,
              },
              totalHashes: total,
            }));
            break;

          case 'share_found':
            console.log(`✅ ${message}`);
            console.log(`Hash: ${hash}`);
            console.log(`Nonce: ${nonce}`);
            
            const winner: Winner = {
              id: crypto.randomUUID(),
              hash: hash,
              nonce: nonce,
              timestamp: Date.now(),
              blockHeight: state.difficulty?.blockHeight || 0,
              difficulty: state.difficulty?.difficulty || 0,
              sessionId: 'stratum-session-' + Date.now(),
              bitcoinAddress: 'bc1qwykm65ww56yax302sezngucwlr9ryr3upk7n3r',
            };
            
            get().addWinner(winner);
            get().showWinner(winner);
            break;

          case 'share_submitted':
            console.log(`📤 ${message}`);
            break;

          case 'complete':
            console.log(message);
            set((state) => ({
              isMining: false,
              progress: null,
              totalHashes: totalHashes,
              totalAttempts: state.totalAttempts + 100000,
            }));
            break;

          case 'error':
            console.error(`❌ ${message}`);
            set({
              error: message,
              lastError: new Error(message),
              isMining: false,
            });
            break;
        }
      };

      worker.onerror = (error) => {
        set({
          error: 'Worker error: ' + error.message,
          lastError: error as unknown as Error,
          isMining: false,
          isConnected: false,
        });
      };

      set({ worker, isConnected: true, error: null });
    } catch (error) {
      set({
        error: 'Failed to initialize mining worker',
        lastError: error as Error,
        isConnected: false,
      });
    }
  },

  terminateWorker: () => {
    const state = get();
    if (state.worker) {
      state.worker.terminate();
      set({ worker: null, isConnected: false, isMining: false });
    }
  },

  startMining: async (attemptCount = 100000) => {
    const state = get();
    
    if (!state.worker || !state.isConnected) {
      set({ error: 'Mining worker not connected. Is the server running?' });
      return;
    }

    set({
      isMining: true,
      startTime: Date.now(),
      error: null,
      progress: { current: 0, total: 100000, percentage: 0 },
    });

    // Send mine action to worker (which connects to Stratum via WebSocket)
    state.worker.postMessage({ action: 'mine' });
  },

  stopMining: () => {
    const state = get();
    if (state.worker && state.isMining) {
      state.worker.terminate();
      get().initializeWorker(); // Reinitialize for next mining session
    }
    
    set({
      isMining: false,
      progress: null,
    });
  },

  updateDifficulty: (difficulty) => {
    set({ difficulty });
    
    // Calculate probability based on current total attempts
    const state = get();
    if (state.totalAttempts > 0) {
      const singleAttemptProb = 1 / difficulty.difficulty;
      const totalProb = 1 - Math.pow(1 - singleAttemptProb, state.totalAttempts);
      const oneIn = Math.floor(1 / singleAttemptProb);
      
      set({
        probability: {
          perAttempt: singleAttemptProb,
          total: totalProb,
          oneIn,
          formatted: `1 in ${oneIn.toLocaleString()}`,
        },
      });
    }
  },

  addResult: (result) => {
    set((state) => ({
      results: [...state.results.slice(-999), result], // Keep last 1000 results
      latestResult: result,
    }));
  },

  addWinner: (winner) => {
    set((state) => ({
      winners: [...state.winners, winner],
    }));
  },

  updateProgress: (current, total) => {
    set({
      progress: {
        current,
        total,
        percentage: (current / total) * 100,
      },
    });
  },

  updateHashRate: (hashRate) => {
    set({ hashRate });
  },

  showWinner: (winner) => {
    set({
      showWinnerModal: true,
      latestWinner: winner,
    });
  },

  hideWinnerModal: () => {
    set({
      showWinnerModal: false,
      latestWinner: null,
    });
  },

  clearError: () => {
    set({
      error: null,
      lastError: null,
    });
  },

  reset: () => {
    const state = get();
    if (state.worker) {
      state.worker.terminate();
    }
    
    set({
      ...initialState,
    });
  },
}));