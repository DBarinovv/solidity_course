// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract Crowdsale2 {
    // Who deployed contract (will receive tokens)
    address public owner;
    // When contract was deployed
    uint256 public startTimestamp;
    // Const duration
    uint256 public constant DURATION = 28 days;
    // Const rate
    uint256 public constant RATE = 100;
    // Const hardcap
    uint256 public constant HARDCAP = 0.1 ether;
    // Const 10% for team
    uint256 public constant TEAM_TOKEN_PERCENTAGE = 10;
    // Total amount of Ether raised
    uint256 public totalEtherRaised;
    // Total number of tokens issued
    uint256 public totalTokensIssued;
    // Has been issued or not
    bool public tokensIssuedToTeam = false;

    // User balances
    mapping(address => uint256) public balances;

    // Event shows that some user purchased tokens
    event TokensPurchased(
        address buyer,
        uint256 amountOfETH,
        uint256 amountOfTokens
    );

    event TokensIssuedToTeam(uint256 amountOfTokens);

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
        // Don't accept to much
        require(totalEtherRaised + msg.value <= HARDCAP, "Hardcap reached");

        // Get tokens proportional rate
        uint256 tokensToBuy = msg.value * RATE;
        balances[msg.sender] += tokensToBuy;

        // Update total counters
        totalEtherRaised += msg.value;
        totalTokensIssued += tokensToBuy;

        // Transfer the Ether to the owner
        payable(owner).transfer(msg.value);

        emit TokensPurchased(msg.sender, msg.value, tokensToBuy);
    }

    function issueTokensToTeam() public {
        // Only while closed
        require(
            block.timestamp > startTimestamp + DURATION,
            "Crowdsale not finished"
        );
        require(msg.sender == owner, "Only owner can issue tokens to team");
        require(!tokensIssuedToTeam, "Tokens already issued to team");

        uint256 teamTokens = (totalTokensIssued * TEAM_TOKEN_PERCENTAGE) / 100;
        balances[owner] += teamTokens;
        totalTokensIssued += teamTokens;

        emit TokensIssuedToTeam(teamTokens);
    }
}
