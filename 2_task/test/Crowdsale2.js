const Crowdsale = artifacts.require("Crowdsale2");

function increaseTime(duration) {
    const id = Date.now();

    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [duration],
            id: id
        }, err1 => {
            if (err1) return reject(err1);

            web3.currentProvider.send({
                jsonrpc: "2.0",
                method: "evm_mine",
                id: id + 1
            }, (err2, res) => {
                if (err2) return reject(err2);
                resolve(res);
            });
        });
    });
}

contract("Crowdsale2", accounts => {
    let crowdsale;
    const [owner, buyer1, buyer2] = accounts;
    // Assuming RATE is 100
    const rate = 100;
    // Assuming Hardcap is 0.1 ether
    const hardcap = web3.utils.toWei('0.1', 'ether');

    beforeEach(async () => {
        crowdsale = await Crowdsale.new({ from: owner });
    });

    it("allows buying tokens within hardcap", async () => {
        const amountOfEther = web3.utils.toWei('0.05', 'ether');
        await crowdsale.buyTokens({ from: buyer1, value: amountOfEther });

        const balance = await crowdsale.balances(buyer1);
        assert.equal(balance.toString(), (amountOfEther * rate).toString(), "Incorrect token amount");
    });

    it("prevents buying tokens beyond hardcap", async () => {
        const amountOfEther = web3.utils.toWei('0.05', 'ether');
        await crowdsale.buyTokens({ from: buyer1, value: amountOfEther });

        try {
            // Attempt to buy tokens that exceed the hardcap
            await crowdsale.buyTokens({ from: buyer2, value: hardcap });
            assert.fail("Should have thrown an error");
        } catch (error) {
            assert(error.message.includes("Hardcap reached"), "Expected hardcap reached error");
        }
    });

    it("issues additional tokens to the team after crowdsale", async () => {
        const amountOfEther = web3.utils.toWei('0.01', 'ether');
        await crowdsale.buyTokens({ from: buyer1, value: amountOfEther });

        // Skip 28 days and 1 second
        await increaseTime(28 * 86400 + 1);

        const totalTokensIssuedBefore = await crowdsale.totalTokensIssued();

        await crowdsale.issueTokensToTeam({ from: owner });

        const totalTokensIssuedAfter = await crowdsale.totalTokensIssued();
        const teamTokens = web3.utils.toBN(totalTokensIssuedBefore).mul(web3.utils.toBN(10)).div(web3.utils.toBN(100));

        assert(totalTokensIssuedAfter.eq(totalTokensIssuedBefore.add(teamTokens)), "Incorrect team tokens issued");
    });
});
