// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

contract Escrow {
    enum EscrowState {
        Created,
        Payed,
        DepositFrozen,
        Completed,
        Cancelled
    }

    event Payment(address _escrow);
    event DepositFrozen(address _escrow);
    event Completion(address _escrow);
    event Cancellation(address _escrow);

    // Constants
    uint8 public constant overpaymentPercent = 10;
    uint8 public constant freezeFeePercent = 3;

    // State
    address public buyer;
    address public seller;
    uint public cost;
    string public description;

    uint public deposit;
    uint public freezeFee;
    EscrowState public state;
    bool payedToSeller;

    constructor(
        address _buyer,
        address _seller,
        uint _cost,
        string memory _description
    ) {
        buyer = _buyer;
        seller = _seller;
        cost = _cost;
        description = _description;

        deposit = 0;
        freezeFee = 0;
        state = EscrowState.Created;
        payedToSeller = false;
    }

    modifier onlyBuyer() {
        require(msg.sender == buyer, "only buyer can call this function.");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "only seller can call this function.");
        _;
    }

    function depositRequired() public view returns (uint) {
        return cost + (cost * overpaymentPercent) / 100;
    }

    function freezeFeeRequired() public view returns (uint) {
        return (cost * freezeFeePercent) / 100;
    }

    function pay() external payable onlyBuyer {
        require(state == EscrowState.Created, "wrong state");
        require(msg.value >= depositRequired(), "not enough value sent");

        deposit += msg.value;
        state = EscrowState.Payed;
        emit Payment(address(this));
    }

    function freezeDeposit() external payable onlySeller {
        require(state == EscrowState.Payed, "wrong state");
        require(msg.value >= freezeFeeRequired(), "not enough value sent");

        freezeFee += msg.value;
        state = EscrowState.DepositFrozen;
        emit DepositFrozen(address(this));
    }

    function complete() external onlyBuyer() {
        require(
            state == EscrowState.Payed || state == EscrowState.DepositFrozen,
            "wrong state"
        );

        state = EscrowState.Completed;
        returnOverpayment();
        emit Completion(address(this));
    }

    function cancel() external {
        require(
            msg.sender == seller ||
                (msg.sender == buyer && state != EscrowState.DepositFrozen),
            "not seller, not buyer, or deposit is frozen"
        );
        require(
            state == EscrowState.Created ||
                state == EscrowState.Payed ||
                state == EscrowState.DepositFrozen,
            "wrong state"
        );

        returnFullDeposit();
        returnFreezeFee();
        state = EscrowState.Cancelled;
        emit Cancellation(address(this));
    }

    function payToSeller() external onlySeller() {
        require(state == EscrowState.Completed, "state should be completed");
        require(!payedToSeller, "already payed");

        uint forTransfer = cost + freezeFee;
        deposit -= cost;
        freezeFee = 0;
        payedToSeller = true;

        if (forTransfer > 0) {
            payable(seller).transfer(forTransfer);
        }
    }

    function returnFreezeFee() internal {
        uint forTransfer = freezeFee;
        freezeFee = 0;

        if (forTransfer > 0) {
            payable(seller).transfer(forTransfer);
        }
    }

    function returnFullDeposit() internal {
        uint forTransfer = deposit;
        deposit = 0;

        if (forTransfer > 0) {
            payable(buyer).transfer(forTransfer);
        }
    }

    function returnOverpayment() internal {
        uint forTransfer = deposit;
        if (!payedToSeller) {
            forTransfer -= cost;
        }
        deposit -= forTransfer;

        if (forTransfer > 0) {
            payable(buyer).transfer(forTransfer);
        }
    }
}
