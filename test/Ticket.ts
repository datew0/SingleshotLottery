import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { BUSD, Lottery, Ticket } from "../typechain-types";

describe("Ticket", function(){

    const lotteryName = "LOTTERY-2022"
    const ticketPrice = 100

    let owner: Signer
    let users: Signer[]
    let busd: BUSD
    let lottery: Lottery
    let ticket: Ticket

    beforeEach("Setup", async () => {
        [owner, ...users] = await ethers.getSigners()
    
        busd = (await (await ethers.getContractFactory("BUSD")).deploy()) as BUSD
        await busd.deployed()
        
        lottery = (await (await ethers.getContractFactory("Lottery")).deploy(lotteryName, busd.address, ticketPrice)) as Lottery
        await lottery.deployed()

        ticket = (await ethers.getContractFactory("Ticket")).attach(await lottery.ticket())
      })

    describe("Capabilities", function() {
        it("Should not be transferred between users", async () => {
            await expect(ticket.connect(users[5]).transfer(await users[10].getAddress(), 50)).to.be.reverted
        })
    })
})