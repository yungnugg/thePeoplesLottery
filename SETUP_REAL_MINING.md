# REAL Bitcoin Mining Setup Instructions

## This is NOW REAL Bitcoin mining. Follow these steps:

### 1. Install Bitcoin Core

Download from: https://bitcoin.org/en/download

- Windows: Download Bitcoin Core installer
- Install to default location
- **IMPORTANT**: Initial sync takes 1-2 weeks and requires ~600GB disk space

### 2. Configure Bitcoin Core

Create/edit `bitcoin.conf` file:

**Location:**
- Windows: `C:\Users\YourUsername\AppData\Roaming\Bitcoin\bitcoin.conf`
- Mac: `~/Library/Application Support/Bitcoin/bitcoin.conf`
- Linux: `~/.bitcoin/bitcoin.conf`

**Add these lines:**
```
server=1
rpcuser=bitcoinrpc
rpcpassword=YourSecurePasswordHere123!
rpcallowip=127.0.0.1
rpcport=8332
txindex=1
```

### 3. Start Bitcoin Core

- Launch Bitcoin Core
- Wait for blockchain sync (this takes 1-2 weeks the first time)
- You need the FULL blockchain synced for real mining

### 4. Install Node.js Dependencies

```powershell
cd C:\Users\brett\OneDrive\Desktop\TheLottery
npm install
```

This installs:
- express (web server)
- cors (cross-origin requests)
- bitcoin-core (Bitcoin Core RPC client)
- nodemon (development server)

### 5. Update server.js with your RPC credentials

Edit `server.js` and replace:
```javascript
username: 'your_rpc_username', // Use 'bitcoinrpc' from bitcoin.conf
password: 'your_rpc_password'  // Use the password from bitcoin.conf
```

### 6. Start the Backend Server

```powershell
npm run server
```

You should see:
```
Bitcoin mining server running on port 3001
Wallet address: bc1qwykm65ww56yax302zewngucwlr9ryr3upk7n3r
Make sure Bitcoin Core is running with RPC enabled
```

### 7. Test the Connection

Open browser to http://localhost:3001/api/networkinfo

You should see Bitcoin network info (blocks, difficulty, chain)

### 8. Deploy Your Website

```powershell
firebase deploy
```

## How It Works Now (REAL):

1. ✅ Browser fetches block template from YOUR Bitcoin Core node
2. ✅ Performs real SHA-256 mining with proper block headers
3. ✅ If block found, submits to YOUR Bitcoin Core node
4. ✅ YOUR Bitcoin Core node broadcasts to Bitcoin P2P network
5. ✅ If accepted, block rewards sent to: `bc1qwykm65ww56yax302sezngucwlr9ryr3upk7n3r`

## Important Notes:

- **Server MUST be running**: The Node.js server (`npm run server`) must be running 24/7
- **Bitcoin Core MUST be synced**: You need the full blockchain downloaded
- **Odds are EXTREMELY low**: Browser mining will likely never find a block
- **This is educational**: Real miners use ASICs, not browsers
- **But it IS real**: If a block is found, it WILL be broadcast to Bitcoin network

## Troubleshooting:

**"Failed to fetch block template"**
- Make sure Bitcoin Core is running
- Check RPC credentials in server.js match bitcoin.conf
- Ensure Bitcoin Core is fully synced

**"Connection refused"**
- Start the Node.js server: `npm run server`
- Check port 3001 is not blocked by firewall

**"Block rejected"**
- This is normal - the block didn't meet network difficulty
- Keep mining!
