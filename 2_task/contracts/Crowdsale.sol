// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract Crowdsale {
    // Who deployed contract (will receive tokens)
    address public owner;
    // When contract was deployed
    uint256 public startTimestamp;
    // Const duration
    uint256 public constant DURATION = 28 days;
    // Const rate
    uint256 public constant RATE = 100; 

    // User balances
    mapping(address => uint256) public balances;

    // Event shows that some user purchased tokens
    event TokensPurchased(
        address buyer,
        uint256 amountOfETH,
        uint256 amountOfTokens
    );

    constructor() {
        owner = msg.sender;
        startTimestamp = block.timestamp;
    }

    // Only when ICO is open
    modifier onlyWhileOpen() {
        require(
            block.timestamp >= startTimestamp &&
                block.timestamp <= startTimestamp + DURATION,
            "Crowdsale is closed"
        );
        _;
    }

    function buyTokens() public payable onlyWhileOpen {
        // Don't accept zero value
        require(msg.value > 0, "Must send ETH to buy tokens");

        // Get tokens proportional rate
        uint256 tokensToBuy = msg.value * RATE;
        balances[msg.sender] += tokensToBuy;

        // Transfer the Ether to the owner
        payable(owner).transfer(msg.value);

        emit TokensPurchased(msg.sender, msg.value, tokensToBuy);
    }
}
