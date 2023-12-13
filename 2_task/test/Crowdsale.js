const Crowdsale = artifacts.require("Crowdsale");

contract("Crowdsale", accounts => {
    let crowdsale;
    const owner = accounts[0];
    const buyer = accounts[1];
    // Assuming RATE is 100
    const rate = 100;

    beforeEach(async () => {
        crowdsale = await Crowdsale.new({ from: owner });
    });

    it("should assign tokens to buyers", async () => {
        const amountOfEther = web3.utils.toWei('1', 'ether');
        const expectedTokens = amountOfEther * rate;

        await crowdsale.buyTokens({ from: buyer, value: amountOfEther });

        const balance = await crowdsale.balances(buyer);
        assert.equal(balance.toString(), expectedTokens.toString(), "The buyer should have received tokens");
    });

    it("should transfer Ether to the owner", async () => {
        const initialOwnerBalance = web3.utils.toBN(await web3.eth.getBalance(owner));
        const amountOfEther = web3.utils.toWei('1', 'ether');

        await crowdsale.buyTokens({ from: buyer, value: amountOfEther });

        const finalOwnerBalance = web3.utils.toBN(await web3.eth.getBalance(owner));
        const expectedBalance = initialOwnerBalance.add(web3.utils.toBN(amountOfEther));

        assert(finalOwnerBalance.gte(expectedBalance), "Ether should be transferred to the owner");
    });
});
