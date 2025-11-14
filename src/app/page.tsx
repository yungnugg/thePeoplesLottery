'use client';

import { useState, useEffect, useRef } from 'react';

export default function HomePage() {
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [isMining, setIsMining] = useState(false);
  const [networkDifficulty, setNetworkDifficulty] = useState<number | null>(null);
  const [miningSessions, setMiningSessions] = useState(0);
  const [blockRewardUSD, setBlockRewardUSD] = useState<number | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [minePressCount, setMinePressCount] = useState(0);
  
  // Real mining worker state
  const [isConnected, setIsConnected] = useState(false);
  const [currentHashRate, setCurrentHashRate] = useState(0);
  const [sharesFound, setSharesFound] = useState(0);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [miningProgress, setMiningProgress] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const miningStartTimeRef = useRef<number>(0);

  const HASH_COUNT = 100000; // 100K hashes per mining session

  // Motivational quotes that change every 7 mine presses
  const motivationalQuotes = [
    "Life is either a daring adventure or nothing at all. — Helen Keller",
    "The most difficult thing is the decision to act, the rest is merely tenacity. — Amelia Earhart",
    "In the midst of chaos, there is also opportunity. — Sun Tzu",
    "I have not failed. I've just found 10,000 ways that won't work. — Thomas Edison",
    "It does not matter how slowly you go as long as you do not stop. — Confucius",
    "In the middle of difficulty lies opportunity. — Albert Einstein",
    "If something is important enough, even if the odds are against you, you should still do it. — Elon Musk",
    "Life shrinks or expands in proportion to one's courage. — Anaïs Nin",
    "If you're offered a seat on a rocket ship, don't ask what seat. Just get on. — Sheryl Sandberg",
    "You can't outwit fate by standing on the sidelines… if you don't play you can't win. — Judith McNaught",
    "Energy and persistence conquer all things. — Benjamin Franklin",
    "It always seems impossible until it's done. — Nelson Mandela",
    "We will either find a way or make one. — Hannibal",
    "If you opt for a safe life, you will never know what it's like to win. — Richard Branson",
    "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing or learning to do. — Pelé",
    "Many of life's failures are people who did not realize how close they were to success when they gave up. — Thomas Edison",
    "A little more persistence, a little more effort, and what seemed hopeless failure may turn to glorious success. — Elbert Hubbard",
    "With ordinary talent and extraordinary perseverance, all things are attainable. — Thomas Fowell Buxton",
    "Victory is always possible for the person who refuses to stop fighting. — Napoleon Hill",
    "It's hard to beat a person who never gives up. — Babe Ruth",
    "It is not strength, but perseverance, that produces great works. — Samuel Johnson",
    "A winner is just a loser who tried one more time. — George M. Moore Jr.",
    "Success seems to be connected with action. Successful people keep moving. They make mistakes, but they don't quit. — Conrad Hilton",
    "You miss 100 % of the shots you don't take. — Wayne Gretzky"
  ];

  // Initialize real mining worker (connects to Stratum pool via WebSocket bridge)
  useEffect(() => {
    // Create Web Worker for real Bitcoin mining
    const worker = new Worker('/mining-worker.js');
    workerRef.current = worker;

    // Handle messages from mining worker
    worker.onmessage = (e) => {
      const { type, message, jobId, hashes, total, hash, nonce, totalHashes } = e.data;

      switch (type) {
        case 'connected':
          // Worker connected to Stratum bridge
          console.log('✅ Mining worker connected to Stratum pool');
          setIsConnected(true);
          break;

        case 'job':
          // New mining job received from pool
          console.log(`📋 New mining job: ${jobId}`);
          setCurrentJobId(jobId);
          break;

        case 'started':
          // Mining session started
          console.log(`⛏️ Mining started on job: ${jobId}`);
          setIsMining(true);
          setMiningProgress(0);
          setMiningSessions(prev => prev + 1);
          setMinePressCount(prev => prev + 1);
          miningStartTimeRef.current = Date.now();
          break;

        case 'progress':
          // Update progress during mining (every 10k hashes)
          const progress = (hashes / HASH_COUNT) * 100;
          setMiningProgress(progress);
          setTotalAttempts(total);
          
          // Calculate hash rate (hashes per second)
          const elapsedSeconds = (Date.now() - miningStartTimeRef.current) / 1000;
          const hashRate = elapsedSeconds > 0 ? hashes / elapsedSeconds : 0;
          setCurrentHashRate(Math.floor(hashRate));
          break;

        case 'share_found':
          // Valid share found! This is a WIN in pool mining
          console.log(`✅ ${message}`);
          console.log(`Hash: ${hash}`);
          console.log(`Nonce: ${nonce}`);
          
          setSharesFound(prev => prev + 1);
          setShowWinnerModal(true); // Show winner modal for share
          break;

        case 'share_submitted':
          // Share successfully submitted to pool
          console.log(`📤 ${message}`);
          break;

        case 'complete':
          // Mining session complete
          console.log(message);
          setIsMining(false);
          setMiningProgress(0);
          setTotalAttempts(totalHashes);
          break;

        case 'error':
          // Error occurred
          console.error(`❌ ${message}`);
          setIsMining(false);
          setIsConnected(false);
          break;
      }
    };

    worker.onerror = (error) => {
      console.error('Worker error:', error);
      setIsConnected(false);
      setIsMining(false);
    };

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [HASH_COUNT]);

  // Fetch real Bitcoin data on component mount
  useEffect(() => {
    const fetchBitcoinData = async () => {
      try {
        // Fetch difficulty from latest block
        const blocksResponse = await fetch('https://mempool.space/api/blocks');
        const blocksData = await blocksResponse.json();
        console.log('Blocks data:', blocksData); // Debug log

        if (blocksData && blocksData.length > 0) {
          const latestBlock = blocksData[0];
          const currentDifficulty = latestBlock.difficulty;
          console.log('Current difficulty:', currentDifficulty); // Debug log
          console.log('Difficulty in trillions:', currentDifficulty / 1000000000000); // Debug log
          setNetworkDifficulty(currentDifficulty);

          // Calculate block reward based on halvings (every 210,000 blocks)
          const currentHeight = latestBlock.height;
          console.log('Current block height:', currentHeight); // Debug log

          const halvings = Math.floor(currentHeight / 210000);
          const rewardBTC = 50 / Math.pow(2, halvings);
          console.log('Calculated reward in BTC:', rewardBTC); // Debug log

          // Get BTC price in USD
          const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
          const priceData = await priceResponse.json();
          const btcPrice = priceData.bitcoin.usd;
          console.log('BTC price:', btcPrice); // Debug log

          const rewardUSD = rewardBTC * btcPrice;
          console.log('Reward in USD:', rewardUSD); // Debug log

          setBlockRewardUSD(rewardUSD);
        } else {
          // No blocks data - this shouldn't happen but handle gracefully
        }
      } catch (error) {
        console.error('Failed to fetch Bitcoin data:', error);
        setNetworkDifficulty(62463716667326); // Fallback difficulty ~62.5 trillion
        // Calculate fallback reward based on estimated current height (~921,343 as of Oct 2025)
        const estimatedHeight = 921343;
        const estimatedHalvings = Math.floor(estimatedHeight / 210000);
        const fallbackRewardBTC = 50 / Math.pow(2, estimatedHalvings);
        const fallbackPrice = 111000; // Estimated BTC price
        setBlockRewardUSD(fallbackRewardBTC * fallbackPrice);
      }
    };

    fetchBitcoinData();

    // Update every 30 seconds
    // const interval = setInterval(fetchBitcoinData, 30000);
    // return () => clearInterval(interval);
  }, []);

  // Start mining using real Stratum worker
  const handleMine = () => {
    // Check if worker is connected to Stratum bridge
    if (!isConnected) {
      console.warn('⚠️ Mining worker not connected. Is the server running?');
      alert('Mining server not connected. Please start the server with: npm run server:dev');
      return;
    }

    if (!workerRef.current) {
      console.error('❌ Mining worker not initialized');
      return;
    }

    if (isMining) {
      console.log('⚠️ Already mining...');
      return;
    }

    // Send mine command to worker
    // Worker will connect to Stratum pool, receive job, and start hashing
    console.log('🚀 Starting mining session...');
    workerRef.current.postMessage({ action: 'mine' });
  };

  return (
    <div className="min-h-screen bg-black flex items-start justify-center pt-16">
      <div className="text-center">
        <div className="text-4xl md:text-6xl font-bold text-white mb-4">
          {networkDifficulty && blockRewardUSD ? (
            <>
              1 in {((networkDifficulty / HASH_COUNT) / 1000000000).toFixed(1)} billion chance to win{' '}
              <span className="text-green-400">${blockRewardUSD.toLocaleString()}</span>
            </>
          ) : (
            'Loading Bitcoin data...'
          )}
        </div>

        {/* Sparkling Text */}
        <div className="mb-8 text-center sparkling-text-container">
          <div className="sparkling-text">
            With every click!
            <div className="sparkle sparkle-1">✨</div>
            <div className="sparkle sparkle-2">⭐</div>
            <div className="sparkle sparkle-3">✨</div>
            <div className="sparkle sparkle-4">⭐</div>
            <div className="sparkle sparkle-5">✨</div>
          </div>
        </div>

        {/* Connection Status & Mining Stats */}
        <div className="mb-4 text-sm text-gray-400">
          {isConnected ? (
            <div className="flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>Connected to CKPool</span>
              {currentJobId && <span className="text-gray-500">| Job: {currentJobId.slice(0, 8)}...</span>}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
              <span>Not connected - Start server: npm run server:dev</span>
            </div>
          )}
        </div>

        {/* Mining Progress Bar */}
        {isMining && (
          <div className="mb-4 max-w-md mx-auto">
            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
              <div 
                className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${miningProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Hashing: {Math.floor(miningProgress)}%</span>
              <span>{currentHashRate.toLocaleString()} H/s</span>
            </div>
          </div>
        )}

        {/* Stats Display */}
        {(totalAttempts > 0 || sharesFound > 0) && (
          <div className="mb-4 text-sm text-gray-300 space-y-1">
            <div>Total Hashes: {totalAttempts.toLocaleString()}</div>
            {sharesFound > 0 && (
              <div className="text-green-400 font-semibold">
                ✅ Shares Found: {sharesFound}
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleMine}
          disabled={isMining || !isConnected}
          className="mt-4 px-8 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold rounded-lg text-xl transition-colors"
        >
          {isMining ? 'MINING...' : isConnected ? 'DREAM BIG' : 'SERVER OFFLINE'}
        </button>
      </div>

      {/* Winner Modal - Share Found! */}
      {showWinnerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-2xl">
            <h2 className="text-3xl font-bold text-green-600 mb-4">🎉 VALID SHARE FOUND! 🎉</h2>
            <p className="text-lg mb-4 text-gray-800">
              Your browser found a valid mining share!
            </p>
            <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700 mb-2 font-semibold">
                ✅ Share submitted to CKPool
              </p>
              <p className="text-xs text-gray-600 mb-3">
                Your share has been submitted to the solo mining pool and contributes to finding the next Bitcoin block.
              </p>
              <div className="bg-white p-3 rounded border border-green-200">
                <p className="text-xs text-gray-500 mb-1">Wallet Address:</p>
                <p className="font-mono text-xs text-blue-600 break-all">
                  bc1qwykm65ww56yax302sezngucwlr9ryr3upk7n3r
                </p>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-6">
              <p className="text-sm text-gray-700 mb-1">
                💰 <strong>Total Shares Found: {sharesFound}</strong>
              </p>
              <p className="text-xs text-gray-600">
                Keep mining! If your share leads to a block, rewards (~$350k) will be sent to your wallet.
              </p>
            </div>
            <p className="text-xs text-gray-400 mb-4 italic">
              Real Bitcoin mining via CKPool solo mining pool
            </p>
            <button
              onClick={() => setShowWinnerModal(false)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Continue Mining
            </button>
          </div>
        </div>
      )}

      {/* Motivational Quote Display */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <blockquote className="text-lg md:text-xl text-gray-300 italic font-light leading-relaxed">
            &ldquo;{motivationalQuotes[Math.floor(minePressCount / 7) % motivationalQuotes.length]}&rdquo;
          </blockquote>
        </div>
      </div>
    </div>
  );
}