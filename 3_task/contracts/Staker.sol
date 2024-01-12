// SPDX-License-Identifier: UNLICENSED 
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

interface IExampleExternalContract {
    function complete() external;
}

contract Staker is ERC721 {
    address public owner;
    uint256 public deadline;
    uint256 public threshold;
    bool public isCompleted;
    uint256 public totalFunds;
    IExampleExternalContract public exampleExternalContract;

    enum Tier { None, Bronze, Silver, Gold }
    mapping(address => uint256) public contributions;      
    address[] public contributors;
    mapping(address => Tier) public rewards;

    uint256 private _nextTokenId;

    event ContributionReceived(address contributor, uint256 amount);
    event WithdrawalMade(address contributor, uint256 amount);
    event ThresholdReached(uint256 totalFunds);
    event NFTIssued(address contributor, Tier tier);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    constructor(address _externalContractAddress, uint256 _durationMinutes, uint256 _threshold) ERC721("CrowdfundingReward", "CFR") {
        owner = msg.sender;
        deadline = block.timestamp + _durationMinutes * 1 minutes;
        threshold = _threshold * 1 ether;
        isCompleted = false;
        exampleExternalContract = IExampleExternalContract(_externalContractAddress);
    }

    function contribute() external payable {
        require(block.timestamp <= deadline, "Crowdfunding has ended.");
        require(msg.value > 0, "Contribution must be greater than 0.");

        if (contributions[msg.sender] == 0) {
            contributors.push(msg.sender);
        }
        contributions[msg.sender] += msg.value;
        totalFunds += msg.value;

        emit ContributionReceived(msg.sender, msg.value);

        if (totalFunds >= threshold && !isCompleted) {
            isCompleted = true;
            payable(address(exampleExternalContract)).transfer(address(this).balance);
            exampleExternalContract.complete();
            emit ThresholdReached(totalFunds);
        }
    }

    function withdraw() external {
        require(block.timestamp > deadline, "Crowdfunding not yet ended.");
        require(!isCompleted, "Threshold reached, withdrawal not allowed.");
        require(contributions[msg.sender] > 0, "No contributions to withdraw.");

        uint256 amount = contributions[msg.sender];
        contributions[msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit WithdrawalMade(msg.sender, amount);
    }

    function issueReward(address contributor) internal {
        uint256 amount = contributions[contributor];
        if (amount >= threshold / 10) {
            rewards[contributor] = Tier.Gold;
        } else if (amount >= threshold / 20) {
            rewards[contributor] = Tier.Silver;
        } else if (amount > 0) {
            rewards[contributor] = Tier.Bronze;
        } else {
            return;
        }

        _mint(contributor, _nextTokenId++);
        emit NFTIssued(contributor, rewards[contributor]);
    }

    function issueRewardsToAll() external onlyOwner {
        require(block.timestamp > deadline, "Crowdfunding not yet ended.");
        require(isCompleted, "Funding goal not reached.");

        for (uint256 i = 0; i < contributors.length; i++) {
            issueReward(contributors[i]);
        }
    }
}
