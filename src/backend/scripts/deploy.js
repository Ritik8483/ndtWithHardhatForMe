async function main() {
  const [deployer] = await ethers?.getSigners(); // The ethers.getSigners() function is used to get a list of available signers.

  // Get the ContractFactories and Signers here.
  const NFT = await ethers?.getContractFactory("NFT");
  // deploy contracts
  const nft = await NFT.deploy();
  const Marketplace = await ethers?.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(1);

  // Save copies of each contracts abi and address to the frontend.
  saveFrontendFiles(marketplace, "Marketplace");
  saveFrontendFiles(nft, "NFT");
}

function saveFrontendFiles(contract, name) {
  const fs = require("fs"); //fs (File System) module, which is a built-in module in Node.js for performing file-related operations.
  //The fs module allows you to read and write files, create directories, and perform various file system tasks.
  const contractsDir = __dirname + "/../../frontend/contractsData";
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    // This is a method provided by the fs module for synchronously writing data to a file. It takes two main arguments: the file path and the data to write.
    contractsDir + `/${name}-address.json`,
    JSON.stringify({ address: contract.address }, undefined, 2) //replacer function or an array that specifies which properties of the object should be included in the JSON string. In this case, it's undefined, indicating that all properties of the object should be included
  ); //number of spaces to use for indentation in the resulting JSON string. In this case, it's 2, which means the JSON string will be formatted with two spaces for each level of indentation, making it more human-readable

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
