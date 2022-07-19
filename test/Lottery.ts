import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { BUSD, Lottery, Ticket } from "../typechain-types";

describe("Lottery", function(){

    const lotteryName = "LOTTERY-2022"
    const initialBalance = BigNumber.from(10_000)
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
        for (const user of users) {
          await busd.credit(await user.getAddress(), initialBalance)
        }

        // Users have ${initialBalance} BUSD balances
        const balances = await Promise.all(users.map(async u => await busd.balanceOf(await u.getAddress())))
        expect(balances.every(b => b.eq(initialBalance))).to.be.true
        
        lottery = (await (await ethers.getContractFactory("Lottery")).deploy(lotteryName, busd.address, ticketPrice)) as Lottery
        await lottery.deployed()

        ticket = (await ethers.getContractFactory("Ticket")).attach(await lottery.ticket())
      })

    describe("Deployment", function(){
        it(`Should be provisioned with name ${lotteryName}`, async function () {
            const actualName = await lottery.name()

            expect(actualName).to.equal(lotteryName)
            console.log("Lottery name: " + actualName)
          });

        it("Should keep owner address", async function() {
            const actualOwner = await lottery.owner()

            expect(actualOwner).to.equal(await owner.getAddress())
            console.log("Lottery owner address: " + actualOwner)
        })

        it("Should have not-null token address", async function() {
            const actualTokenAddress = await lottery.ticket()

            expect(actualTokenAddress).not.to.equal(ethers.constants.AddressZero)
            console.log("Token address: " + actualTokenAddress)
        })

        it("Should have no registered players", async function () {
            const unregistered = await Promise.all(users.map(async u => await u.getAddress()).map(async addr => !await lottery.registered(addr)))
            
            expect(unregistered.every(Boolean)).to.be.true
        })
    })

    describe("Capabilities", function(){

        const registerBets = async function (betDistr: number[]) {
            for (let i = 0; i < betDistr.length; i++) {
                const total = betDistr[i] * ticketPrice
                await busd.connect(users[i]).approve(lottery.address, total)
                await lottery.connect(users[i]).buy(total)
            }
        }

        const toAddress = async function (signers: Signer[]) {
            return await Promise.all(signers.map(async s => await s.getAddress()))
        }

        it("Should sell tickets", async function() {
            const numOfTickets = 10
            const total = numOfTickets * ticketPrice
            await busd.connect(users[1]).approve(lottery.address, total)
            await lottery.connect(users[1]).buy(total)

            const address = await users[1].getAddress()

            expect((await busd.balanceOf(address))).to.equal(initialBalance.sub(total))
            expect((await ticket.balanceOf(address)).toNumber()).to.equal(numOfTickets)
        })

        it("Should register players", async function() {
            const players = 12
            await registerBets([10,20,30,40])

            for (const i in [...Array(4).keys()]) {
                expect(await lottery.registered(await users[i].getAddress())).to.be.true
            }
        })

        it("Should nominate winners by owner`s call", async function() {
            const winners = [
                await users[1].getAddress(),
                await users[2].getAddress(),
                await users[5].getAddress()
            ]
            
            await registerBets([10,20,30,40,50,60,70])

            // Try nominate winners by non-owner
            await expect(lottery.connect(users[10]).draw(winners)).to.be.reverted

            await lottery.draw(winners)
            
            for(const w of winners) {
                expect(await lottery.won(w)).to.be.true
            }

            expect(await lottery.isOpen()).to.be.false
        })

        it("Should give rewards to winners and emit event", async function() {
            const winners = [
                users[1],
                users[4]
            ]
            
            await registerBets([10,20,30,40,20])
            await lottery.draw(await toAddress(winners))
            
            for(const w of winners) {
                const beforeBUSD = (await busd.balanceOf(await w.getAddress())).toNumber()
                console.log("Before BUSD: %d", beforeBUSD)

                await lottery.connect(w).claim()
                
                const afterBUSD = (await busd.balanceOf(await w.getAddress())).toNumber()
                console.log("After BUSD: %d", afterBUSD)
                expect(afterBUSD - beforeBUSD).to.equal(60 * ticketPrice)
            }
        })

        it("Should revoke tickets on claim()", async function() {
            const winners = [
                users[1],
                users[4]
            ]
            
            await registerBets([10,20,30,40,20])
            await lottery.draw(await toAddress(winners))
            
            for(const w of winners) {
                const beforeTickets = (await ticket.balanceOf(await w.getAddress())).toNumber()
                console.log("Before Tickets: %d", beforeTickets)

                await lottery.connect(w).claim()
                
                const afterTickets = (await ticket.balanceOf(await w.getAddress())).toNumber()
                console.log("After Tickets: %d", afterTickets)

                expect(beforeTickets - afterTickets).to.equal(20)
            }
        })

    })
})