// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Import this file to use console.log
import "hardhat/console.sol";

contract BUSD is ERC20("BUSD", "BUSD"), Ownable {

    function credit(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}