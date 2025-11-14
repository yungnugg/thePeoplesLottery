# CKPool Solo Mining Setup

## Overview

This project uses **browser-based mining** connected to **CKPool's solo mining pool** via a WebSocket bridge. This is a lightweight, technically accurate approach that doesn't require downloading the entire Bitcoin blockchain.

## Architecture

```
Browser (Web Worker) ⟷ WebSocket ⟷ Node.js Bridge ⟷ CKPool Stratum
```

- **Browser**: Performs SHA-256 double hashing (100,000 hashes per click)
- **Node.js Bridge**: Translates between WebSocket and Stratum protocol
- **CKPool**: Provides mining work and handles block submission

## How It Works

### 1. Mining Pool Connection
- Server connects to `solo.ckpool.org:3333` using Stratum protocol
- Authenticates with wallet address: `bc1qwykm65ww56yax302sezngucwlr9ryr3upk7n3r`
- Receives mining jobs (block templates) from pool

### 2. Browser Mining
- Web Worker receives job via WebSocket
- Performs 100,000 hashes per button click
- Uses real double SHA-256 (same as Bitcoin mining)
- Checks if hash meets difficulty target

### 3. Share Submission
- When valid share found, submits to pool via WebSocket
- Bridge forwards to CKPool using Stratum protocol
- If block found, rewards sent to wallet address

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `ws`: WebSocket server for browser communication
- `express`: HTTP server
- `cors`: Cross-origin resource sharing

### 2. Start the Bridge Server

```bash
npm run server
```

Or for development with auto-restart:

```bash
npm run server:dev
```

The server will:
- Listen for WebSocket connections on `ws://localhost:3001`
- Connect to CKPool at `solo.ckpool.org:3333`
- Forward mining jobs to browser
- Submit shares back to pool

### 3. Start the Frontend

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### 4. Start Mining

- Click "Drop Ball" to start Plinko game
- Click "Start Mining" to begin hashing
- Watch for share submissions in console

## Technical Details

### Hashing Rate
- **100,000 hashes per button click**
- Browser performs real double SHA-256 hashing
- Uses Web Crypto API for performance

### Difficulty
- Pool sets difficulty for share submission
- Much lower than Bitcoin network difficulty
- Allows browser to find shares without ASICs

### Block Header Format
- Standard 80-byte Bitcoin block header
- Version + Previous Hash + Merkle Root + Timestamp + Bits + Nonce
- Double SHA-256 hashing just like real miners

### Stratum Protocol
- Industry-standard mining pool protocol
- Methods used:
  - `mining.subscribe`: Subscribe to mining notifications  - `mining.authorize`: Authenticate with wallet address
  - `mining.notify`: Receive new jobs from pool
  - `mining.submit`: Submit valid shares

## Wallet Information

**Address**: `bc1qwykm65ww56yax302sezngucwlr9ryr3upk7n3r`

If a valid block is found and accepted by the network:
- Block reward (currently 3.125 BTC) sent to this address
- Plus transaction fees from block
- Solo mining means **you keep 100% of rewards**

## Monitoring

### Server Console
```
✅ Connected to CKPool solo.ckpool.org:3333
✅ Authorized with CKPool
💰 Mining to wallet: bc1qwykm65ww56yax302sezngucwlr9ryr3upk7n3r
📋 New mining job: <job_id>
🌐 Browser miner connected
📤 Submitting share to CKPool...
✅ Share accepted by pool!
```

### Browser Console
```
Connected to Stratum bridge
New job: <job_id>
Difficulty: 1024
Valid share found!
Share submitted to pool
```

## Realistic Expectations

### Share Submission
- With difficulty 1024 and 100k hashes per click
- Chance of finding share: ~0.01%
- Expect 1 share per 10,000 clicks (approximate)

### Block Mining
- Bitcoin network difficulty: ~60 trillion
- Solo mining requires finding hash below network difficulty
- Browser mining unlikely to find blocks (need ASICs)
- **This is for educational/lottery purposes**

## Advantages of This Approach

✅ **No blockchain download** (CKPool handles it)
✅ **Lightweight** (just Node.js bridge + browser)
✅ **Real mining protocol** (Stratum is industry standard)
✅ **Technically accurate** (double SHA-256, proper headers)
✅ **Solo mining** (keep 100% if you find a block)

## Files

- `server.js`: Stratum WebSocket bridge
- `mining-worker.js`: Browser mining Web Worker
- `package.json`: Dependencies and scripts

## Troubleshooting

### "No job available"
- Check server is running (`npm run server`)
- Check server connected to CKPool (see console)
- Wait a few seconds for initial job

### WebSocket connection error
- Ensure server is running on port 3001
- Check firewall isn't blocking localhost connections
- Verify `WS_URL` in mining-worker.js is correct

### Share rejected
- Normal - some shares get rejected
- Could be stale job (new block found)
- Could be timing issue with pool

## Resources

- **CKPool Website**: https://solo.ckpool.org/
- **Stratum Protocol**: https://braiins.com/stratum-v1/docs
- **Bitcoin Mining**: https://en.bitcoin.it/wiki/Mining

---

**Remember**: This is **real Bitcoin mining**, but browser-based solo mining has extremely low probability of finding blocks. This is primarily for educational purposes and the "lottery" aspect of the project.
