import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { BigNumber, ContractReceipt } from "ethers";
import { ethers } from "hardhat";
import {
  Nft,
  NftMarketFixedPrice,
  NftMarketFixedPrice__factory,
  Nft__factory,
} from "../typechain";

async function getNetworkTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}

function getEventFromContractReceipt(event: string, receipt: ContractReceipt) {
  return receipt.events?.find((ev) => ev.event == event);
}

describe("NftMarketFixedPrice", function () {
  let accounts: SignerWithAddress[];
  let Nft: Nft__factory;
  let nft: Nft;
  let NftMarketFixedPrice: NftMarketFixedPrice__factory;
  let nftMarketFixedPrice: NftMarketFixedPrice;

  before(async () => {
    accounts = await ethers.getSigners();

    Nft = await ethers.getContractFactory("Nft");
    nft = await Nft.deploy();
    await nft.deployed();

    NftMarketFixedPrice = await ethers.getContractFactory(
      "NftMarketFixedPrice"
    );
    nftMarketFixedPrice = await NftMarketFixedPrice.deploy();
    await nftMarketFixedPrice.deployed();

    await (await nftMarketFixedPrice.approveProvider(nft.address, true)).wait();
  });

  describe("normal flow", function () {
    let seller: SignerWithAddress;
    let buyer: SignerWithAddress;
    let sellerNft: Nft;
    let sellerNftMarketFixedPrice: NftMarketFixedPrice;
    let buyerNftMarketFixedPrice: NftMarketFixedPrice;
    let nftTokenId: BigNumber;
    let listingId: BigNumber;
    let price: BigNumber;

    before(async () => {
      seller = accounts[0];
      buyer = accounts[1];
      price = (await buyer.getBalance()).div(2);
      sellerNft = nft.connect(seller);
      sellerNftMarketFixedPrice = nftMarketFixedPrice.connect(seller);
      buyerNftMarketFixedPrice = nftMarketFixedPrice.connect(buyer);
    });

    it("mint an nft", async () => {
      const mintReceipt = await (await nft.mint(seller.address)).wait();
      const transfer = getEventFromContractReceipt("Transfer", mintReceipt);
      assert(transfer, "transfer event not emitted");
      nftTokenId = transfer.args?.tokenId;
    });

    it("list the nft", async function () {
      await (
        await sellerNft.approve(nftMarketFixedPrice.address, nftTokenId)
      ).wait();

      const txRcpt = await (
        await sellerNftMarketFixedPrice.list(
          nft.address,
          nftTokenId,
          price,
          (await getNetworkTimestamp()) + 3600 * 24 * 1,
          (await getNetworkTimestamp()) + 3600 * 24 * 2
        )
      ).wait();
      const listEvent = getEventFromContractReceipt("List", txRcpt);
      expect(listEvent).to.be.ok;
      listingId = listEvent?.args?.listingId;

      // The nft is transfered to the market
      const nftOwner = await nft.ownerOf(nftTokenId);
      expect(nftOwner).to.equal(nftMarketFixedPrice.address);
    });

    it("buy the nft", async function () {
      const sellerInitialBalance = await seller.getBalance();
      const buyerInitialBalance = await buyer.getBalance();

      const buyReceipt = await (
        await buyerNftMarketFixedPrice.buy(listingId, { value: price })
      ).wait();
      const closeEvent = getEventFromContractReceipt("Close", buyReceipt);
      expect(closeEvent).to.be.ok;
      const buyGasCost = buyReceipt.gasUsed.mul(buyReceipt.effectiveGasPrice);

      const sellerFinalBalance = await seller.getBalance();
      const buyerFinalBalance = await buyer.getBalance();

      // The nft is transfered to the buyer
      const nftOwner = await nft.ownerOf(nftTokenId);
      expect(nftOwner).to.equal(buyer.address);

      // The fund is exchanged
      expect(sellerFinalBalance.eq(sellerInitialBalance.add(price))).to.be.true;
      expect(
        buyerFinalBalance.eq(buyerInitialBalance.sub(price).sub(buyGasCost))
      ).to.be.true;
    });
  });

  describe("cancel flow", function () {
    let seller: SignerWithAddress;
    let buyer: SignerWithAddress;
    let sellerNft: Nft;
    let sellerNftMarketFixedPrice: NftMarketFixedPrice;
    let buyerNftMarketFixedPrice: NftMarketFixedPrice;
    let nftTokenId: BigNumber;
    let listingId: BigNumber;
    let price: BigNumber;

    before(async () => {
      seller = accounts[0];
      buyer = accounts[1];
      price = (await buyer.getBalance()).div(2);
      sellerNft = nft.connect(seller);
      sellerNftMarketFixedPrice = nftMarketFixedPrice.connect(seller);
      buyerNftMarketFixedPrice = nftMarketFixedPrice.connect(buyer);
    });

    it("mint an nft", async () => {
      const mintReceipt = await (await nft.mint(seller.address)).wait();
      const transfer = getEventFromContractReceipt("Transfer", mintReceipt);
      assert(transfer, "transfer event not emitted");
      nftTokenId = transfer.args?.tokenId;
    });

    it("list the nft", async function () {
      await (
        await sellerNft.approve(nftMarketFixedPrice.address, nftTokenId)
      ).wait();

      const txRcpt = await (
        await sellerNftMarketFixedPrice.list(
          nft.address,
          nftTokenId,
          price,
          (await getNetworkTimestamp()) + 3600 * 24 * 1,
          (await getNetworkTimestamp()) + 3600 * 24 * 2
        )
      ).wait();
      const listEvent = getEventFromContractReceipt("List", txRcpt);
      expect(listEvent).to.be.ok;
      listingId = listEvent?.args?.listingId;

      // The nft is transfered to the market
      const nftOwner = await nft.ownerOf(nftTokenId);
      expect(nftOwner).to.equal(nftMarketFixedPrice.address);
    });

    it("cancel the listing", async function () {
      const closeReceipt = await (
        await buyerNftMarketFixedPrice.close(listingId)
      ).wait();
      const closeEvent = getEventFromContractReceipt("Close", closeReceipt);
      expect(closeEvent).to.be.ok;

      // The nft is transfered back to the seller
      const nftOwner = await nft.ownerOf(nftTokenId);
      expect(nftOwner).to.equal(seller.address);
    });
  });
});
