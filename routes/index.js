let express = require('express');
let router = express.Router();

const publicAddress = "mj4CNS8gScsNDhZDqFCGJfghEMHRpvfg9t";

router.get('/', function(req, res) {
    res.render('index', {
        balance: getBalance(publicAddress),
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

    // TODO: Test if the given BTC address is valid for the given network ...

    sendBitcoin(address, btcAmount);
    req.flash('success', btcAmount + " BTC sent successfully to " + address
        + ". I may take up to few minutes before the transaction is completed.");
    res.redirect("/");
});

function getBalance(address) {
    // TODO: Retrieve the real BTC balance for a given address
    return parseFloat("0").toFixed(8);
}

function sendBitcoin(toAddress, btcAmount) {
    // TODO: Proceed to do the real transfer ...
}

module.exports = router;
