// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Ticket.sol";

contract Lottery is Ownable {
    
    string public name;

    ERC20 private token;
    uint public ticketPrice; // in BUSD tokens
    Ticket public ticket;

    bool public isOpen = true;
    mapping(address => bool) public registered;
    mapping(address => bool) public won;
    uint256 public prizeFund;
    uint256 private totalWinTickets;

    constructor(string memory name_, address token_, uint ticketPrice_) {
        name = name_;
        token = ERC20(token_);
        ticket = new Ticket(name_, name_);
        ticketPrice = ticketPrice_;
    }

    function buy(uint256 amountBUSD) external returns(uint256) {
        require(isOpen, "Registration is closed");
        require(amountBUSD >= ticketPrice, "Not enough BUSD tokens");

        uint256 numOfTickets = amountBUSD / ticketPrice;
        uint256 ticketsCost = numOfTickets * ticketPrice;
        require(token.allowance(msg.sender, address(this)) >= ticketsCost, "Amount of BUSD isn`t approved");
        
        token.transferFrom(msg.sender, address(this), ticketsCost);
        ticket.credit(msg.sender, numOfTickets);

        registered[msg.sender] = true;

        return numOfTickets;
    }

    function claim() external {
        require(!isOpen, "The lottery has not ended yet");
        require(registered[msg.sender], "You must be registered to claim reward");
        
        uint256 tickets = ticket.balanceOf(msg.sender);

        uint256 prize;
        if (won[msg.sender]) {
            prize = (prizeFund * tickets) / totalWinTickets;
            token.transfer(msg.sender, prize);
        }
        ticket.revoke(msg.sender, tickets);
        
        emit RewardClaimed(msg.sender, prize);
    }

    function draw(address[] calldata winners) external onlyOwner {
        require(isOpen, "Lottery is over");
        for (uint i = 0; i < winners.length; i++) {
            require(registered[winners[i]], "Unknown player specified");
            won[winners[i]] = true;
            totalWinTickets += ticket.balanceOf(winners[i]);
        }
        isOpen = false;
        prizeFund = token.balanceOf(address(this));

        emit Drawn(winners, prizeFund);
    }

    event Drawn(address[] won, uint256 pfund);
    event RewardClaimed(address winner, uint256 amount);
}
