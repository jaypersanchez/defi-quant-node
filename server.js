require('dotenv').config();
const express = require('express');
const Compound = require('@compound-finance/compound-js');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const INFURA_URL = process.env.INFURA_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const compound = new Compound(INFURA_URL, { privateKey: PRIVATE_KEY });

// 📌 Fetch Compound Rates
app.get('/compound_rates', async (req, res) => {
    try {
        const blocksPerYear = 4 * 60 * 24 * 365; // ~2102400 blocks per year

        // Fetch supply and borrow rates per block
        const supplyRatePerBlock = await Compound.eth.read(
            Compound.util.getAddress(Compound.cUSDC),
            'function supplyRatePerBlock() public view returns (uint)',
            [],
            { provider: compound._provider }
        );

        const borrowRatePerBlock = await Compound.eth.read(
            Compound.util.getAddress(Compound.cUSDC),
            'function borrowRatePerBlock() public view returns (uint)',
            [],
            { provider: compound._provider }
        );

        // Convert to APY using Compound's formula: (1 + ratePerBlock) ^ blocksPerYear - 1
        const supplyAPY = (Math.pow((supplyRatePerBlock / 1e18) + 1, blocksPerYear) - 1) * 100;
        const borrowAPY = (Math.pow((borrowRatePerBlock / 1e18) + 1, blocksPerYear) - 1) * 100;

        res.json({
            USDC_Supply_APY: supplyAPY.toFixed(2), // Round to 2 decimal places
            USDC_Borrow_APY: borrowAPY.toFixed(2)
        });
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

// 📌 Supply USDC
app.post('/supply_usdc', async (req, res) => {
    try {
        const amount = req.body.amount;
        console.log(`Supplying ${amount / 1e6} USDC to Compound...`);

        const tx = await compound.supply(Compound.USDC, amount);
        console.log("Supply USDC Transaction:", tx);

        res.json({ message: `Supplied ${amount / 1e6} USDC`, tx });

    } catch (error) {
        console.error("Supply USDC Error:", error);

        // Extract error message
        const errorMessage = error?.error?.message || error.message || error.toString();
        res.status(500).json({ error: errorMessage });
    }
});



// 📌 Borrow DAI
app.post('/borrow_dai', async (req, res) => {
    try {
        const amount = req.body.amount;
        console.log(`Borrowing ${amount / 1e18} DAI from Compound...`);

        const tx = await compound.borrow(Compound.DAI, amount);
        console.log("Borrow DAI Transaction:", tx);

        res.json({ message: `Borrowed ${amount / 1e18} DAI`, tx });

    } catch (error) {
        console.error("Borrow DAI Error:", error);

        const errorMessage = error?.error?.message || error.message || error.toString();
        res.status(500).json({ error: errorMessage });
    }
});


// 📌 Repay DAI
app.post('/repay_dai', async (req, res) => {
    try {
        const amount = req.body.amount;
        console.log(`Repaying ${amount / 1e18} DAI to Compound...`);

        const tx = await compound.repayBorrow(Compound.DAI, amount);
        console.log("Repay DAI Transaction:", tx);

        res.json({ message: `Repaid ${amount / 1e18} DAI`, tx });

    } catch (error) {
        console.error("Repay DAI Error:", error);

        const errorMessage = error?.error?.message || error.message || error.toString();
        res.status(500).json({ error: errorMessage });
    }
});


// Start Server
app.listen(4000, () => console.log('Compound API running on port 4000'));
