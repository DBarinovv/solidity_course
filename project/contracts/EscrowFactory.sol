// SPDX-License-Identifier: UNLICENSED 
pragma solidity ^0.8.20;

import "./Escrow.sol";

contract EscrowFactory {
    event Created(address escrow);

    function newEscrow(
        address _buyer,
        address _seller,
        uint _cost,
        string memory _description
    ) public returns(address) {
        Escrow escrow = new Escrow(_buyer, _seller, _cost, _description);

        emit Created(address(escrow));
        return address(escrow);
    }
}
