// server.js - Stratum Bridge for CKPool Solo Mining
// Bridges WebSocket (browser) ⟷ Stratum TCP (CKPool)

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const net = require('net');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// CKPool solo mining server
const CKPOOL_HOST = 'solo.ckpool.org';
const CKPOOL_PORT = 3333;
const WALLET_ADDRESS = 'bc1qwykm65ww56yax302sezngucwlr9ryr3upk7n3r';
const WORKER_NAME = 'lottery_miner';

let stratumClient = null;
let currentJob = null;
let connectedBrowsers = new Set();

// Connect to CKPool Stratum server
function connectToStratum() {
  stratumClient = new net.Socket();
  
  stratumClient.connect(CKPOOL_PORT, CKPOOL_HOST, () => {
    console.log('✅ Connected to CKPool solo.ckpool.org:3333');
    
    // Subscribe to mining notifications
    sendStratumCommand({
      id: 1,
      method: 'mining.subscribe',
      params: ['lottery-miner/1.0.0']
    });
    
    // Authorize with wallet address
    sendStratumCommand({
      id: 2,
      method: 'mining.authorize',
      params: [`${WALLET_ADDRESS}.${WORKER_NAME}`, '']
    });
  });
  
  stratumClient.on('data', (data) => {
    const messages = data.toString().split('\n').filter(m => m.trim());
    
    messages.forEach(msg => {
      try {
        const response = JSON.parse(msg);
        handleStratumResponse(response);
      } catch (e) {
        console.error('Failed to parse Stratum response:', msg);
      }
    });
  });
  
  stratumClient.on('error', (err) => {
    console.error('❌ Stratum connection error:', err.message);
    setTimeout(connectToStratum, 5000); // Reconnect after 5s
  });
  
  stratumClient.on('close', () => {
    console.log('Stratum connection closed. Reconnecting...');
    setTimeout(connectToStratum, 5000);
  });
}

function sendStratumCommand(command) {
  if (stratumClient && stratumClient.writable) {
    stratumClient.write(JSON.stringify(command) + '\n');
  }
}

function handleStratumResponse(response) {
  // Handle mining.notify (new job)
  if (response.method === 'mining.notify') {
    const params = response.params;
    currentJob = {
      jobId: params[0],
      prevHash: params[1],
      coinbase1: params[2],
      coinbase2: params[3],
      merkleTree: params[4],
      version: params[5],
      nbits: params[6],
      ntime: params[7],
      cleanJobs: params[8]
    };
    
    console.log(`📋 New mining job: ${currentJob.jobId}`);
    
    // Send job to all connected browsers
    broadcastToMiners({
      type: 'job',
      job: currentJob
    });
  }
  
  // Handle mining.set_difficulty
  if (response.method === 'mining.set_difficulty') {
    const difficulty = response.params[0];
    console.log(`🎯 Difficulty set to: ${difficulty}`);
    
    broadcastToMiners({
      type: 'difficulty',
      difficulty: difficulty
    });
  }
  
  // Handle authorization response
  if (response.id === 2 && response.result) {
    console.log('✅ Authorized with CKPool');
    console.log(`💰 Mining to wallet: ${WALLET_ADDRESS}`);
  }
  
  // Handle share submission response
  if (response.result !== undefined && response.id > 100) {
    if (response.result === true) {
      console.log('✅ Share accepted by pool!');
    } else {
      console.log('❌ Share rejected:', response.error);
    }
  }
}

function broadcastToMiners(message) {
  connectedBrowsers.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

// WebSocket connection from browser
wss.on('connection', (ws) => {
  console.log('🌐 Browser miner connected');
  connectedBrowsers.add(ws);
  
  // Send current job if available
  if (currentJob) {
    ws.send(JSON.stringify({
      type: 'job',
      job: currentJob
    }));
  }
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Handle share submission from browser
      if (data.type === 'submit') {
        console.log('📤 Submitting share to CKPool...');
        
        sendStratumCommand({
          id: data.id,
          method: 'mining.submit',
          params: [
            `${WALLET_ADDRESS}.${WORKER_NAME}`,
            data.jobId,
            data.nonce2,
            data.ntime,
            data.nonce
          ]
        });
      }
    } catch (e) {
      console.error('Failed to parse browser message:', e);
    }
  });
  
  ws.on('close', () => {
    console.log('🌐 Browser miner disconnected');
    connectedBrowsers.delete(ws);
  });
});

// Health check endpoint
app.get('/api/status', (req, res) => {
  res.json({
    connected: stratumClient && stratumClient.writable,
    miners: connectedBrowsers.size,
    currentJob: currentJob ? currentJob.jobId : null,
    wallet: WALLET_ADDRESS
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Stratum bridge running on port ${PORT}`);
  console.log(`💰 Wallet: ${WALLET_ADDRESS}`);
  connectToStratum();
});
