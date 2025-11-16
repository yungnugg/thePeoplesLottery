// mining-worker.js - Browser Stratum Mining Worker
// Wallet: bc1qwykm65ww56yax302sezngucwlr9ryr3upk7n3r

const HASHES_PER_BATCH = 100000;

// Auto-detect WebSocket URL based on environment
// Production: Railway server
// Development: localhost
const getWebSocketURL = () => {
  // Check if we're on localhost/development
  if (typeof location !== 'undefined') {
    const hostname = location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'ws://localhost:3001';
    }
  }
  
  // Production: Railway WebSocket server (secure connection)
  return 'wss://thepeopleslottery-production.up.railway.app';
};

const WS_URL = getWebSocketURL();

let ws = null;
let isMining = false;
let totalHashes = 0;
let currentJob = null;
let difficulty = 1;
let shareId = 100;

function connectWebSocket() {
  ws = new WebSocket(WS_URL);
  
  ws.onopen = () => {
    console.log("Connected to Stratum bridge");
    postMessage({ type: "connected" });
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === "job") {
        currentJob = data.job;
        console.log("New job:", currentJob.jobId);
        postMessage({ type: "job", jobId: currentJob.jobId });
      }
      
      if (data.type === "difficulty") {
        difficulty = data.difficulty;
        console.log("Difficulty:", difficulty);
      }
    } catch (e) {
      console.error("Parse error:", e);
    }
  };
  
  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    postMessage({ type: "error", message: "Connection error" });
  };
  
  ws.onclose = () => {
    console.log("Reconnecting...");
    setTimeout(connectWebSocket, 5000);
  };
}

async function sha256(bytes) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return new Uint8Array(hashBuffer);
}

async function doubleSHA256(bytes) {
  const hash1 = await sha256(bytes);
  const hash2 = await sha256(hash1);
  return hash2;
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function uint32ToLE(num) {
  const bytes = new Uint8Array(4);
  bytes[0] = num & 0xff;
  bytes[1] = (num >> 8) & 0xff;
  bytes[2] = (num >> 16) & 0xff;
  bytes[3] = (num >> 24) & 0xff;
  return bytes;
}

function reverseBytes(hex) {
  const bytes = hexToBytes(hex);
  return bytesToHex(bytes.reverse());
}

function calculateTarget(diff) {
  const maxTarget = BigInt("0x00000000FFFF0000000000000000000000000000000000000000000000000000");
  const target = maxTarget / BigInt(Math.floor(diff));
  return target.toString(16).padStart(64, "0");
}

function buildBlockHeader(job, nonce, nonce2, ntime) {
  const version = reverseBytes(job.version);
  const prevHash = reverseBytes(job.prevHash);
  const coinbase = job.coinbase1 + nonce2 + job.coinbase2;
  const merkleRoot = coinbase.substr(0, 64);
  const timestamp = reverseBytes(ntime);
  const bits = reverseBytes(job.nbits);
  const nonceHex = reverseBytes(nonce.toString(16).padStart(8, "0"));
  return version + prevHash + merkleRoot + timestamp + bits + nonceHex;
}

async function mine() {
  if (isMining) {
    postMessage({ type: "error", message: "Already mining" });
    return;
  }
  
  if (!currentJob) {
    postMessage({ type: "error", message: "No job available" });
    return;
  }
  
  isMining = true;
  postMessage({ type: "started", jobId: currentJob.jobId });
  
  try {
    const target = calculateTarget(difficulty);
    const startNonce = Math.floor(Math.random() * 0xFFFFFFFF);
    const nonce2 = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, "0");
    const ntime = currentJob.ntime;
    let hashCount = 0;
    let found = false;
    
    for (let i = 0; i < HASHES_PER_BATCH && !found; i++) {
      const nonce = (startNonce + i) & 0xFFFFFFFF;
      const headerHex = buildBlockHeader(currentJob, nonce, nonce2, ntime);
      const headerBytes = hexToBytes(headerHex);
      const hash = await doubleSHA256(headerBytes);
      const hashHex = bytesToHex(hash.reverse());
      
      hashCount++;
      totalHashes++;
      
      if (hashHex < target) {
        found = true;
        postMessage({
          type: "share_found",
          message: "Valid share found!",
          hash: hashHex,
          nonce: nonce
        });
        
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: "submit",
            id: shareId++,
            jobId: currentJob.jobId,
            nonce2: nonce2,
            ntime: ntime,
            nonce: bytesToHex(uint32ToLE(nonce))
          }));
          postMessage({ type: "share_submitted", message: "Share submitted to pool" });
        }
      }
      
      if (hashCount % 10000 === 0) {
        postMessage({ type: "progress", hashes: hashCount, total: totalHashes });
      }
    }
    
    if (!found) {
      postMessage({
        type: "complete",
        message: "Completed " + hashCount.toLocaleString() + " hashes. No share found.",
        totalHashes: totalHashes
      });
    }
  } catch (error) {
    postMessage({ type: "error", message: error.message });
  } finally {
    isMining = false;
  }
}

connectWebSocket();

self.addEventListener("message", (e) => {
  if (e.data.action === "mine") {
    mine();
  }
});
