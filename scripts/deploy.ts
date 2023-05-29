import { ethers } from "hardhat";
import { NftMarketEnglishAuction, NftMarketFixedPrice } from "../typechain";
import { Nft } from "../typechain/Nft";

// export async function deployNftStore(): Promise<NftStore> {
//   const Contract = await ethers.getContractFactory("NftStore");
//   console.log(`Deploying NftStore...`);
//   const contract = await Contract.deploy();
//   await contract.deployed();
//   console.log(`NftStore deployed to:`, contract.address);
//   return contract;
// }

export async function deployNft(): Promise<Nft> {
  const Contract = await ethers.getContractFactory("Nft");
  console.log(`Deploying Nft...`);
  const contract = await Contract.deploy();
  await contract.deployed();
  console.log(`Nft deployed to:`, contract.address);
  return contract;
}

export async function deployNftMarketFixedPrice(): Promise<NftMarketFixedPrice> {
  const Contract = await ethers.getContractFactory("NftMarketFixedPrice");
  console.log(`Deploying NftMarketFixedPrice...`);
  const contract = await Contract.deploy();
  await contract.deployed();
  console.log(`NftMarketFixedPrice deployed to:`, contract.address);
  return contract;
}

export async function deployNftMarketEnglishAuction(): Promise<NftMarketEnglishAuction> {
  const Contract = await ethers.getContractFactory("NftMarketEnglishAuction");
  console.log(`Deploying NftMarketEnglishAuction...`);
  const contract = await Contract.deploy();
  await contract.deployed();
  console.log(`NftMarketEnglishAuction deployed to:`, contract.address);
  return contract;
}

// export async function deployUpgradeableContract(
//   options: { name: string },
//   { ethers, upgrades }: HardhatRuntimeEnvironment
// ) {
//   const Contract = await ethers.getContractFactory(options.name);
//   console.log(`Deploying an upgradeable version of ${options.name}...`);
//   const contract = await upgrades.deployProxy(Contract);
//   await contract.deployed();
//   console.log(`${options.name} deployed to:`, contract.address);
//   return contract;
// }

// export async function upgradeContract(
//   options: {
//     address: string;
//     name: string;
//   },
//   { ethers, upgrades }: HardhatRuntimeEnvironment
// ) {
//   const Contract = await ethers.getContractFactory(options.name);
//   console.log(`Upgrading ${options.name}...`);
//   await upgrades.upgradeProxy(options.address, Contract);
//   console.log(`${options.name} updagraded`);
// }

async function main() {
  const nft = await deployNft();

  const nftMarketFixedPrice = await deployNftMarketFixedPrice();

  await (await nftMarketFixedPrice.approveProvider(nft.address, true)).wait();

  console.log("Nft approved to NftMarketFixedPrice.");

  const nftMarketEnglishAuction = await deployNftMarketEnglishAuction();

  await (
    await nftMarketEnglishAuction.approveProvider(nft.address, true)
  ).wait();

  console.log("Nft approved to NftMarketEnglishAuction.");
}

main();
