// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Ticket is ERC20, Ownable {

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

    function decimals() public view virtual override returns (uint8) {
        return 0;
    }

    function transfer(address to, uint256 amount) public override returns(bool){
        require(to == owner(), "Tickets can only be transferred to lottery");
        return ERC20.transfer(to, amount);
    }
    
    function credit(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function revoke(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }
}