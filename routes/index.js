let express = require('express');
let router = express.Router();
const bitcore = require("bitcore-lib");
const axios = require("axios");

const network = "BTCTEST";
const privateKey = "";
const publicAddress = "";

router.get('/', async function (req, res) {
    res.render('index', {
        balance: await getBalance(publicAddress),
        error: req.flash('error'),
        success: req.flash('success'),
        address: publicAddress
    });
});

router.post('/', async function (req, res) {
    let btcAmount = req.body.amount;
    let address = req.body.address;

    if (btcAmount === undefined || btcAmount === "") {
        req.flash('error', "The amount to sent must be given.");
        res.redirect("/");
        return;
    }

    if (isNaN(btcAmount)) {
        req.flash('error', "The amount must be numeric.");
        res.redirect("/");
        return;
    }

    if (address === undefined || address === "") {
        req.flash('error', "The recipient address must be given.");
        res.redirect("/");
        return;
    }

    if (!bitcore.Address.isValid(address, bitcore.Networks.testnet)) {
        req.flash("error", "Invalid recipient address");
        res.redirect("/");
        return;
    }

    try {
        const result = await sendBitcoin(address, btcAmount);
        req.flash('success', btcAmount + " BTC sent successfully to " + address
            + ". It may take up a few minutes for the transaction to complete.");
        res.redirect("/");
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/");
    }
});

async function getBalance(address) {
    const url = `https://chain.so/api/v2/get_address_balance/${network}/${address}`;
    const result = await axios.get(url);
    const data = result.data.data;
    const confirmedBalanced = parseFloat(data.confirmed_balance);
    const unconfirmedBalanced = parseFloat(data.unconfirmed_balance);
    return (confirmedBalanced + unconfirmedBalanced).toFixed(8);
}

async function sendBitcoin(toAddress, btcAmount) {
    const satoshiToSend = Math.ceil(btcAmount * 100000000);
    const txUrl = `https://chain.so/api/v2/get_tx_unspent/${network}/${publicAddress}`;
    const txResult = await axios.get(txUrl);

    let inputs = [];
    let totalAmountAvailable = 0;
    let inputCount = 0;

    for (const element of txResult.data.data.txs) {
        let utx = {};
        utx.satoshis = Math.floor(Number(element.value) * 100000000);
        utx.script = element.script_hex;
        utx.address = txResult.data.data.address;
        utx.txId = element.txid;
        utx.outputIndex = element.output_no;
        totalAmountAvailable += utx.satoshis;
        inputCount++;
        inputs.push(utx);
    }

    const transaction = new bitcore.Transaction();
    transaction.from(inputs);

    let outputCount = 2;
    let transactionSize = (inputCount * 148) + (outputCount * 34) + 10;
    let fee = transactionSize * 20;

    if (totalAmountAvailable - satoshiToSend - fee < 0) {
        throw new Error("Not enough BTC to cover for the transaction.");
    }

    transaction.to(toAddress, satoshiToSend);
    transaction.fee(fee);
    transaction.change(publicAddress);

    transaction.sign(privateKey);
    const serializedTransaction = transaction.serialize();
    const result = await axios({
        method: "post",
        url: `https://chain.so/api/v2/send_tx/${network}`,
        data: {
            tx_hex: serializedTransaction
        }
    });
    return result.data.data;
}

module.exports = router;
