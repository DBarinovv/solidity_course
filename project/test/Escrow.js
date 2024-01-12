const EscrowFactory = artifacts.require("EscrowFactory");
const Escrow = artifacts.require("Escrow");

contract("EscrowFactory", (accounts) => {
    let escrowFactory;
    const buyer = accounts[1];
    const seller = accounts[2];
    const cost = web3.utils.toWei("1", "ether");
    const description = "Test Escrow";

    beforeEach(async () => {
        escrowFactory = await EscrowFactory.new();
    });

    it("initialize", async () => {
        const result = await escrowFactory.newEscrow(buyer, seller, cost, description, { from: accounts[0] });
        // console.log(result.logs[0]);
        assert.equal(result.logs[0].event, "Created");

        const escrowAddress = result.logs[0].args.escrow;
        const escrow = await Escrow.at(escrowAddress);

        assert.equal(await escrow.buyer(), buyer);
        assert.equal(await escrow.seller(), seller);
        assert.equal(await escrow.cost(), cost);
        assert.equal(await escrow.description(), description);
        assert.equal(await escrow.state(), 0); // EscrowState.Created
        assert.equal(await escrow.deposit(), 0);
        assert.equal(await escrow.freezeFee(), 0);
    });


    it("pay the deposit", async () => {
        const result = await escrowFactory.newEscrow(buyer, seller, cost, description, { from: accounts[0] });
        // console.log(result.logs[0]);
        assert.equal(result.logs[0].event, "Created");

        const escrowAddress = result.logs[0].args.escrow;
        const escrow = await Escrow.at(escrowAddress);

        const depositRequired = await escrow.depositRequired();
        // console.log(web3.utils.fromWei(depositRequired.toString(), 'ether'));
        const payTx = await escrow.pay({ from: buyer, value: depositRequired });

        assert.equal(await escrow.state(), 1); // EscrowState.Payed

        const depositedAmount = await escrow.deposit();
        assert.equal(depositedAmount.toString(), depositRequired);

        assert.equal(payTx.logs[0].event, "Payment");
    });

    it("freeze the deposit", async () => {
        const result = await escrowFactory.newEscrow(buyer, seller, cost, description, { from: accounts[0] });
        // console.log(result.logs[0]);
        assert.equal(result.logs[0].event, "Created");

        const escrowAddress = result.logs[0].args.escrow;
        const escrow = await Escrow.at(escrowAddress);

        const depositRequired = await escrow.depositRequired();
        const payTx = await escrow.pay({ from: buyer, value: depositRequired });

        const freezeFeeRequired = await escrow.freezeFeeRequired();
        const freezeTx = await escrow.freezeDeposit({ from: seller, value: freezeFeeRequired });
        // console.log(freezeTx.logs[0]);

        assert.equal(await escrow.state(), 2); // EscrowState.DepositFrozen

        const freezeFee = await escrow.freezeFee();
        assert.equal(freezeFee.toString(), freezeFeeRequired);

        assert.equal(freezeTx.logs[0].event, "DepositFrozen");
    });

    it("complete the transaction", async () => {
        const result = await escrowFactory.newEscrow(buyer, seller, cost, description, { from: accounts[0] });
        // console.log(result.logs[0]);
        assert.equal(result.logs[0].event, "Created");

        const escrowAddress = result.logs[0].args.escrow;
        const escrow = await Escrow.at(escrowAddress);

        const depositRequired = await escrow.depositRequired();
        const payTx = await escrow.pay({ from: buyer, value: depositRequired });

        const freezeFeeRequired = await escrow.freezeFeeRequired();
        const freezeTx = await escrow.freezeDeposit({ from: seller, value: freezeFeeRequired });

        const completionTx = await escrow.complete({ from: buyer });

        assert.equal(await escrow.state(), 3); // EscrowState.Complete

        assert.equal(completionTx.logs[0].event, "Completion");
    });

    it("cancel the transaction", async () => {
        const result = await escrowFactory.newEscrow(buyer, seller, cost, description, { from: accounts[0] });
        // console.log(result.logs[0]);
        assert.equal(result.logs[0].event, "Created");

        const escrowAddress = result.logs[0].args.escrow;
        const escrow = await Escrow.at(escrowAddress);

        const cancelTx = await escrow.cancel({ from: seller });

        assert.equal(await escrow.state(), 4); // EscrowState.Cancelled

        assert.equal(cancelTx.logs[0].event, "Cancellation");
    });

    it("main logic", async () => {
        const result = await escrowFactory.newEscrow(buyer, seller, cost, description, { from: accounts[0] });
        // console.log(result.logs[0]);
        assert.equal(result.logs[0].event, "Created");

        const escrowAddress = result.logs[0].args.escrow;
        const escrow = await Escrow.at(escrowAddress);

        // Record initial balances
        const initialBuyerBalance = await web3.eth.getBalance(buyer);
        const initialSellerBalance = await web3.eth.getBalance(seller);

        // Buyer pays the deposit + overpayment
        const depositRequired = await escrow.depositRequired();
        await escrow.pay({ from: buyer, value: depositRequired });

        // Seller freezes the deposit
        const freezeFeeRequired = await escrow.freezeFeeRequired();
        await escrow.freezeDeposit({ from: seller, value: freezeFeeRequired });

        // Buyer marks the transaction as completed
        await escrow.complete({ from: buyer });

        // Seller withdraws the cost and freeze fee
        await escrow.payToSeller({ from: seller });

        // Assert final contract state and balances
        const finalState = await escrow.state();
        assert.equal(finalState.toString(), 3, "state should be Completed"); // EscrowState.Completed

        const finalDeposit = await escrow.deposit();
        assert.equal(finalDeposit, 0, "deposit should be 0 after completion");

        const finalFreezeFee = await escrow.freezeFee();
        assert.equal(finalFreezeFee, 0, "freeze fee should be 0 after completion");

        // Record final balances
        const finalBuyerBalance = await web3.eth.getBalance(buyer);
        const finalSellerBalance = await web3.eth.getBalance(seller);

        // Check correctness
        assert(initialBuyerBalance > finalBuyerBalance + cost);
        assert(initialSellerBalance < finalSellerBalance);
    });
});
