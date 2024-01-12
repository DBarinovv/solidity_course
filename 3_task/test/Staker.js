const Staker = artifacts.require("Staker");
const MockExampleExternalContract = artifacts.require("MockExampleExternalContract");

contract("Staker", (accounts) => {
    let staker;
    let mockExternalContract;
    const [owner, contributor1, contributor2] = accounts;

    beforeEach(async () => {
        mockExternalContract = await MockExampleExternalContract.new();
        staker = await Staker.new(
            mockExternalContract.address, 
            5,  // Duration in minutes
            1,  // Threshold in ether
            { from: owner }
        );
    });

    it("allows contributions", async () => {
        const contributionAmount = web3.utils.toWei("0.1", "ether");
        await staker.contribute({ from: contributor1, value: contributionAmount });

        const contributed = await staker.contributions(contributor1);
        assert.equal(
            contributed.toString(),
            contributionAmount,
            "Contribution amount doesn't match"
        );
    });

    it("issues correct tier NFTs", async () => {
        const goldTierAmount = web3.utils.toWei("0.5", "ether");
        await staker.contribute({ from: contributor2, value: goldTierAmount });

        // Time travel to the future to simulate deadline passing
        await advanceTime(300); // Advance 5 minutes

        await staker.issueRewardsToAll({ from: owner });

        const rewardTier = await staker.rewards(contributor2);
        assert.equal(rewardTier.toNumber(), 3, "Contributor should receive a Gold tier NFT"); // Gold is represented by 3 in the enum
    });

    it("allows withdrawal if threshold not met", async () => {
        const contributionAmount = web3.utils.toWei("0.1", "ether");
        await staker.contribute({ from: contributor1, value: contributionAmount });

        // Time travel to the future to simulate deadline passing
        await advanceTime(300); // Advance 5 minutes

        const initialBalance = await web3.eth.getBalance(contributor1);
        await staker.withdraw({ from: contributor1 });
        const finalBalance = await web3.eth.getBalance(contributor1);

        assert(finalBalance > initialBalance, "Balance should be greater after withdrawal");
    });

    // Helper function to advance time on the blockchain
    function advanceTime(time) {
        return new Promise((resolve, reject) => {
            web3.currentProvider.send({
                jsonrpc: '2.0',
                method: 'evm_increaseTime',
                params: [time],
                id: new Date().getTime()
            }, (err, result) => {
                if (err) { return reject(err); }
                return resolve(result);
            });
        });
    }
});
