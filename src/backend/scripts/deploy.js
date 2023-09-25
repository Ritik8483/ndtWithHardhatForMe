// import { ethers } from "ethers";
// import { artifacts } from "hardhat";

async function main() {
  const [deployer] = await ethers?.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Get the ContractFactories and Signers here.
  const NFT = await ethers?.getContractFactory("NFT");
  // deploy contracts
  const nft = await NFT.deploy();
  const Marketplace = await ethers?.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(1);
  console.log("NFT address:", nft.address);
  console.log("marketplace address:", marketplace.address);

  // Save copies of each contracts abi and address to the frontend.
  saveFrontendFiles(marketplace, "Marketplace");
  saveFrontendFiles(nft, "NFT");
}

function saveFrontendFiles(contract, name) {            //saving abi,address in frontend
  const fs = require("fs");
  const contractsDir = __dirname + "/../../frontend/contractsData";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + `/${name}-address.json`,
    JSON.stringify({ address: contract.address }, undefined, 2)
  );

  const contractArtifact = artifacts?.readArtifactSync(name);

  fs.writeFileSync(
    contractsDir + `/${name}.json`,
    JSON.stringify(contractArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
