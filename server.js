require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const Compound = require('@compound-finance/compound-js');

const app = express();
app.use(express.json());

const INFURA_URL = process.env.INFURA_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;

// ✅ Detect the correct JsonRpcProvider syntax
let provider;
if (ethers.providers) {
    provider = new ethers.providers.JsonRpcProvider(INFURA_URL);  // ✅ For Ethers.js v5
} else {
    const { JsonRpcProvider } = require("ethers");
    provider = new JsonRpcProvider(INFURA_URL);  // ✅ For Ethers.js v6
}

const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const compound = new Compound(provider, { privateKey: PRIVATE_KEY });

// Tokens Supported via SDK (No ABI Needed)
const SDK_TOKENS = ["USDC", "DAI", "UNI", "LINK", "COMP", "AAVE", "MKR", "SUSHI"];

// 📌 Get List of Supported Tokens
app.get('/compound/supported-tokens', async (req, res) => {
    res.json({ supportedTokens: SDK_TOKENS });
});

// 📌 Supply Assets to Compound (Only SDK Compatible Tokens)
app.post('/compound/supply', async (req, res) => {
    try {
        const { token, amount } = req.body;
        
        if (!SDK_TOKENS.includes(token)) {
            return res.status(400).json({
                error: `Unsupported token '${token}'. We currently support: ${SDK_TOKENS.join(', ')}.`
            });
        }

        const tx = await compound.supply(token, amount);
        res.json({ message: `Supplied ${amount} ${token} to Compound`, txHash: tx });

    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

// 📌 Borrow Assets from Compound (Only SDK Compatible Tokens)
app.post('/compound/borrow', async (req, res) => {
    try {
        const { token, amount } = req.body;
        
        if (!SDK_TOKENS.includes(token)) {
            return res.status(400).json({
                error: `Unsupported token '${token}'. We currently support: ${SDK_TOKENS.join(', ')}.`
            });
        }

        const tx = await compound.borrow(token, amount);
        res.json({ message: `Borrowed ${amount} ${token} from Compound`, txHash: tx });

    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

// 📌 Start the server
app.listen(4000, () => console.log("🚀 Node.js API running on port 4000"));
