import { ethers } from "hardhat";
import { Lottery } from "../typechain-types";

async function main() {
  
  const owner = (await ethers.getSigners())[0]

  const lotteryName = "LOTTERY-2022"

  const bsctestnetBUSD = "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee"
  const busd = (await ethers.getContractFactory("ERC20")).attach(bsctestnetBUSD)
        
  const lottery = (await (await ethers.getContractFactory("Lottery")).deploy(lotteryName, bsctestnetBUSD, 100)) as Lottery
  await lottery.deployed()

  const ticket = (await ethers.getContractFactory("Ticket")).attach(await lottery.ticket())

  console.log("%s deployed on: %s", lotteryName, lottery.address)
  console.log("Owner is: %s", owner.address)

  await busd.approve(lottery.address, 1000)
  await lottery.buy(1000)

  console.log("Tickets on balance: %d", await ticket.balanceOf(await owner.getAddress()))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
