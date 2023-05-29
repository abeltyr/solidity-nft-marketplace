import { ethers } from "hardhat";

const nftAddress = "0x370fe0E03eC40032928cd9314EF173b5EBcC165A";
const nftMarketFixedPriceAddress = "0xa8D1F5d64B5537607521120915c7F5dB43C2bc77";

async function getNetworkTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}

export async function main() {
  const accounts = await ethers.getSigners();
  const seller = accounts[0];

  const Nft = await ethers.getContractFactory("Nft");
  const nft = Nft.attach(nftAddress);
  const sellerNft = nft.connect(seller);

  const NftMarketFixedPrice = await ethers.getContractFactory(
    "NftMarketFixedPrice"
  );
  const nftMarketFixedPrice = NftMarketFixedPrice.attach(
    nftMarketFixedPriceAddress
  );
  const sellerNftMarketFixedPrice = nftMarketFixedPrice.connect(seller);

  const res = await (await nft.mint(seller.address)).wait();
  const transfer = res.events?.find((ev) => ev.event == "Transfer");
  const tokenId = transfer?.args?.tokenId;
  await (await sellerNft.approve(nftMarketFixedPrice.address, tokenId)).wait();

  const txRcpt = await (
    await sellerNftMarketFixedPrice.list(
      nft.address,
      tokenId,
      233,
      (await getNetworkTimestamp()) + 3600 * 24 * 1,
      (await getNetworkTimestamp()) + 3600 * 24 * 2
    )
  ).wait();
  const listEvent = txRcpt.events?.find((ev) => ev.event == "List");
  const listingId = listEvent?.args?.listingId;
  console.log({ listingId });
}

main();
