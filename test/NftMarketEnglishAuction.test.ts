import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { BigNumber, ContractReceipt } from "ethers";
import { ethers, network } from "hardhat";
import {
  Nft,
  NftMarketEnglishAuction,
  NftMarketEnglishAuction__factory,
  Nft__factory,
} from "../typechain";

async function getNetworkTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}

function getEventFromContractReceipt(event: string, receipt: ContractReceipt) {
  return receipt.events?.find((ev) => ev.event == event);
}

async function increaseNetworkTime(by: number) {
  await network.provider.send("evm_increaseTime", [by]);
}

describe("NftMarketEnglishAuction", function () {
  let accounts: SignerWithAddress[];
  let Nft: Nft__factory;
  let nft: Nft;
  let NftMarketEnglishAuction: NftMarketEnglishAuction__factory;
  let nftMarketEnglishAuction: NftMarketEnglishAuction;

  before(async () => {
    accounts = await ethers.getSigners();

    Nft = await ethers.getContractFactory("Nft");
    nft = await Nft.deploy();
    await nft.deployed();

    NftMarketEnglishAuction = await ethers.getContractFactory(
      "NftMarketEnglishAuction"
    );
    nftMarketEnglishAuction = await NftMarketEnglishAuction.deploy();
    await nftMarketEnglishAuction.deployed();

    await (
      await nftMarketEnglishAuction.approveProvider(nft.address, true)
    ).wait();
  });

  describe("normal flow", function () {
    let seller: SignerWithAddress;
    let bidder: SignerWithAddress;
    let bidder1: SignerWithAddress;
    let bidder2: SignerWithAddress;
    let sellerNft: Nft;
    let sellerNftMarketEnglishAuction: NftMarketEnglishAuction;
    let bidderNftMarketEnglishAuction: NftMarketEnglishAuction;
    let bidder1NftMarketEnglishAuction: NftMarketEnglishAuction;
    let bidder2NftMarketEnglishAuction: NftMarketEnglishAuction;
    let nftTokenId: BigNumber;
    let auctionId: BigNumber;
    let startingPrice: BigNumber;

    before(async () => {
      seller = accounts[0];
      bidder = accounts[1];
      bidder1 = accounts[2];
      bidder2 = accounts[3];
      startingPrice = (await bidder.getBalance()).div(10);
      sellerNft = nft.connect(seller);
      sellerNftMarketEnglishAuction = nftMarketEnglishAuction.connect(seller);
      bidderNftMarketEnglishAuction = nftMarketEnglishAuction.connect(bidder);
      bidder1NftMarketEnglishAuction = nftMarketEnglishAuction.connect(bidder1);
      bidder2NftMarketEnglishAuction = nftMarketEnglishAuction.connect(bidder2);
    });

    it("mint an nft", async () => {
      const mintReceipt = await (await nft.mint(seller.address)).wait();
      const transfer = getEventFromContractReceipt("Transfer", mintReceipt);
      assert(transfer, "transfer event not emitted");
      nftTokenId = transfer.args?.tokenId;
    });

    it("list the nft", async function () {
      await (
        await sellerNft.approve(nftMarketEnglishAuction.address, nftTokenId)
      ).wait();

      const txRcpt = await (
        await sellerNftMarketEnglishAuction.list(
          nft.address,
          nftTokenId,
          startingPrice,
          (await getNetworkTimestamp()) + 3600 * 24 * 1,
          (await getNetworkTimestamp()) + 3600 * 24 * 3
        )
      ).wait();
      const listEvent = getEventFromContractReceipt("List", txRcpt);
      expect(listEvent).to.be.ok;
      auctionId = listEvent?.args?.auctionId;

      // The nft is transferred to the market
      const nftOwner = await nft.ownerOf(nftTokenId);
      expect(nftOwner).to.equal(nftMarketEnglishAuction.address);
    });

    it("bid for the nft", async function () {
      await increaseNetworkTime(3600 * 24 * 2);
      const bidderInitialBalance = await bidder.getBalance();

      let price = Number(ethers.utils.formatEther(startingPrice)) + 1;
      let finalPrice = ethers.utils.parseEther(price.toString());
      const bidReceipt = await (
        await bidderNftMarketEnglishAuction.bid(auctionId, {
          value: finalPrice,
        })
      ).wait();
      const bidEvent = getEventFromContractReceipt("Bid", bidReceipt);

      expect(bidEvent).to.be.ok;
      const bidGasCost = bidReceipt.gasUsed.mul(bidReceipt.effectiveGasPrice);

      const bidderFinalBalance = await bidder.getBalance();

      expect(
        bidderFinalBalance.eq(
          bidderInitialBalance.sub(finalPrice).sub(bidGasCost)
        )
      ).to.be.true;
    });
    it("second bid with a new user ", async function () {
      const bidderInitialBalance = await bidder1.getBalance();

      let price = Number(ethers.utils.formatEther(startingPrice)) + 2;
      let finalPrice = ethers.utils.parseEther(price.toString());
      const bidReceipt = await (
        await bidder1NftMarketEnglishAuction.bid(auctionId, {
          value: finalPrice,
        })
      ).wait();

      const bidEvent = getEventFromContractReceipt("Bid", bidReceipt);

      expect(bidEvent).to.be.ok;
      const bidGasCost = bidReceipt.gasUsed.mul(bidReceipt.effectiveGasPrice);

      const bidderFinalBalance = await bidder1.getBalance();

      expect(
        bidderFinalBalance.eq(
          bidderInitialBalance.sub(finalPrice).sub(bidGasCost)
        )
      ).to.be.true;
    });
    it("third bid for the same user ", async function () {
      const bidderInitialBalance = await bidder.getBalance();

      let price = Number(ethers.utils.formatEther(startingPrice)) + 2;
      let finalPrice = ethers.utils.parseEther(price.toString());
      const bidReceipt = await (
        await bidderNftMarketEnglishAuction.bid(auctionId, {
          value: finalPrice,
        })
      ).wait();

      const bidEvent = getEventFromContractReceipt("Bid", bidReceipt);

      expect(bidEvent).to.be.ok;
      const bidGasCost = bidReceipt.gasUsed.mul(bidReceipt.effectiveGasPrice);

      const bidderFinalBalance = await bidder.getBalance();

      expect(
        bidderFinalBalance.eq(
          bidderInitialBalance.sub(finalPrice).sub(bidGasCost)
        )
      ).to.be.true;
    });
    it("fourth bid with lower amount fail", async function () {
      try {
        const bidReceipt = await (
          await bidder2NftMarketEnglishAuction.bid(auctionId, {
            value: startingPrice,
          })
        ).wait();
        expect(bidReceipt).null;
      } catch (e: any) {
        expect(e.message.includes("Bid is less then the highest bid")).true;
      }
    });
    it("try to withdrawing your fund before closing Fail", async function () {
      try {
        const withdrawReceipt = await (
          await bidderNftMarketEnglishAuction.withdraw(auctionId)
        ).wait();

        expect(withdrawReceipt).null;
      } catch (e: any) {
        expect(e.message.includes("Auction is not closed")).true;
      }
    });
    it("Close the Auction", async function () {
      const closeReceipt = await (
        await sellerNftMarketEnglishAuction.close(auctionId)
      ).wait();

      const closeEvent = getEventFromContractReceipt("Close", closeReceipt);

      expect(closeEvent).to.be.ok;

      const auction = await sellerNftMarketEnglishAuction._auctions(auctionId);

      expect(Number(auction.closeDate)).to.greaterThan(0);
      expect(auction.highestBidder).to.eq(bidder.address);
    });
    it("try closing again your Auction Fail", async function () {
      try {
        const closeReceipt = await (
          await sellerNftMarketEnglishAuction.close(auctionId)
        ).wait();

        expect(closeReceipt).null;
      } catch (e: any) {
        expect(e.message.includes("Auction already closed")).true;
      }
    });
    it("seller withdrawer auction win", async function () {
      const sellerInitialBalance = await seller.getBalance();

      const withdrawReceipt = await (
        await sellerNftMarketEnglishAuction.withdraw(auctionId)
      ).wait();

      const withDrawEvent = getEventFromContractReceipt(
        "Withdraw",
        withdrawReceipt
      );

      expect(withDrawEvent).to.be.ok;
      const withDrawGasCost = withdrawReceipt.gasUsed.mul(
        withdrawReceipt.effectiveGasPrice
      );

      const sellerFinalBalance = await seller.getBalance();

      let auctionWinner = await sellerNftMarketEnglishAuction._auctions(
        auctionId
      );
      let expectedBalance = sellerInitialBalance
        .add(auctionWinner.highestBid)
        .sub(withDrawGasCost);

      expect(sellerFinalBalance.eq(expectedBalance)).to.be.true;
    });
    it("seller try withdrawing fund again Fail", async function () {
      try {
        const withdrawReceipt = await (
          await sellerNftMarketEnglishAuction.withdraw(auctionId)
        ).wait();

        expect(withdrawReceipt).null;
      } catch (e: any) {
        expect(e.message.includes("No Fund Found Under this Auction")).true;
      }
    });
    it("Withdraw your Auction", async function () {
      const bidderInitialBalance = await bidder1.getBalance();

      let bidOf = await sellerNftMarketEnglishAuction.bidOf(
        auctionId,
        bidder1.address
      );

      const withdrawReceipt = await (
        await bidder1NftMarketEnglishAuction.withdraw(auctionId)
      ).wait();

      const withDrawEvent = getEventFromContractReceipt(
        "Withdraw",
        withdrawReceipt
      );

      expect(withDrawEvent).to.be.ok;
      const withDrawGasCost = withdrawReceipt.gasUsed.mul(
        withdrawReceipt.effectiveGasPrice
      );

      const auction = await bidder1NftMarketEnglishAuction._auctions(auctionId);

      expect(auction.highestBidder).to.not.eq(bidder1.address);
      const bidderFinalBalance = await bidder1.getBalance();

      let expectedBalance = bidderInitialBalance
        .add(bidOf)
        .sub(withDrawGasCost);

      expect(bidderFinalBalance.eq(expectedBalance)).to.be.true;
    });
    it("try withdrawing your fund again Fail", async function () {
      try {
        const withdrawReceipt = await (
          await bidder1NftMarketEnglishAuction.withdraw(auctionId)
        ).wait();

        expect(withdrawReceipt).null;
      } catch (e: any) {
        expect(e.message.includes("No Fund Found Under this Auction")).true;
      }
    });
    it("highest bidder trying to withdraw there fund Fail", async function () {
      try {
        const withdrawReceipt = await (
          await bidderNftMarketEnglishAuction.withdraw(auctionId)
        ).wait();

        expect(withdrawReceipt).null;
      } catch (e: any) {
        expect(e.message.includes("Highest bidder can not withdraw")).true;
      }
    });
  });

  describe("cancel flow", function () {
    let seller: SignerWithAddress;
    let bidder: SignerWithAddress;
    let sellerNft: Nft;
    let sellerNftMarketEnglishAuction: NftMarketEnglishAuction;
    let bidderNftMarketEnglishAuction: NftMarketEnglishAuction;
    let nftTokenId: BigNumber;
    let auctionId: BigNumber;
    let startingPrice: BigNumber;

    before(async () => {
      seller = accounts[0];
      bidder = accounts[1];
      startingPrice = (await bidder.getBalance()).div(10);
      sellerNft = nft.connect(seller);
      sellerNftMarketEnglishAuction = nftMarketEnglishAuction.connect(seller);
      bidderNftMarketEnglishAuction = nftMarketEnglishAuction.connect(bidder);
    });

    it("mint an nft", async () => {
      const mintReceipt = await (await nft.mint(seller.address)).wait();
      const transfer = getEventFromContractReceipt("Transfer", mintReceipt);
      assert(transfer, "transfer event not emitted");
      nftTokenId = transfer.args?.tokenId;
    });

    it("list the nft", async function () {
      await (
        await sellerNft.approve(nftMarketEnglishAuction.address, nftTokenId)
      ).wait();

      const txRcpt = await (
        await sellerNftMarketEnglishAuction.list(
          nft.address,
          nftTokenId,
          startingPrice,
          (await getNetworkTimestamp()) + 3600 * 24 * 1,
          (await getNetworkTimestamp()) + 3600 * 24 * 3
        )
      ).wait();
      const listEvent = getEventFromContractReceipt("List", txRcpt);
      expect(listEvent).to.be.ok;
      auctionId = listEvent?.args?.auctionId;

      // The nft is transferred to the market
      const nftOwner = await nft.ownerOf(nftTokenId);
      expect(nftOwner).to.equal(nftMarketEnglishAuction.address);
    });

    it("cancel the Auction", async () => {
      const closeReceipt = await (
        await sellerNftMarketEnglishAuction.close(auctionId)
      ).wait();

      const closeEvent = getEventFromContractReceipt("Close", closeReceipt);
      expect(closeEvent).to.be.ok;
      expect(closeEvent?.args?.buyer).to.eq(
        "0x0000000000000000000000000000000000000000"
      );

      // The nft is transfered back to the seller
      const nftOwner = await nft.ownerOf(nftTokenId);
      expect(nftOwner).to.equal(seller.address);
    });
    it("cancel the Auction by seller again Fail", async () => {
      try {
        const closeReceipt = await (
          await sellerNftMarketEnglishAuction.close(auctionId)
        ).wait();

        expect(closeReceipt).null;
      } catch (e: any) {
        expect(e.message.includes("Auction already closed")).true;
      }
    });
    it("seller trying to withdraw the Auction by seller again Fail", async () => {
      try {
        const closeReceipt = await (
          await sellerNftMarketEnglishAuction.close(auctionId)
        ).wait();

        expect(closeReceipt).null;
      } catch (e: any) {
        expect(e.message.includes("Auction already closed")).true;
      }
    });
    it("seller try withdrawing fund Fail", async function () {
      try {
        const withdrawReceipt = await (
          await sellerNftMarketEnglishAuction.withdraw(auctionId)
        ).wait();

        expect(withdrawReceipt).null;
      } catch (e: any) {
        expect(e.message.includes("No Fund Found Under this Auction")).true;
      }
    });
  });
});
