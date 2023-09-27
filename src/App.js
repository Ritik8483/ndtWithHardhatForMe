import logo from "./logo.svg";
import "./App.css";
import Home from "./frontend/components/Home";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import MarketplaceAddress from "../src/frontend/contractsData/Marketplace-address.json";
import MarketplaceAbi from "../src/frontend/contractsData/Marketplace.json";
import NFTAddress from "../src/frontend/contractsData/NFT-address.json";
import NFTAbi from "../src/frontend/contractsData/NFT.json";

function App() {
  const ownerToken = JSON.parse(localStorage.getItem("nftWithHardhatToken"));
  const [nft, setNFT] = useState({});
  const [marketplace, setMarketplace] = useState({});
  const [account, setAccount] = useState(ownerToken || "");

  const connectAccountWithMetamast = async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    localStorage.setItem("nftWithHardhatToken", JSON.stringify(accounts[0]));
    setAccount(accounts[0]);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    window.ethereum.on("chainChanged", (chainId) => {
      window.location.reload();
    });

    window.ethereum.on("accountsChanged", async function (accounts) {
      setAccount(accounts[0]);
      await connectAccountWithMetamast();
    });
    loadContracts(signer);
  };

  const loadContracts = async (signer) => {
    // Get deployed copies of contracts
    const marketplace = new ethers.Contract(
      MarketplaceAddress.address,
      MarketplaceAbi.abi,
      signer
    );
    setMarketplace(marketplace);

    const nft = new ethers.Contract(NFTAddress.address, NFTAbi.abi, signer);
    setNFT(nft);
  };

  useEffect(() => {
    if (ownerToken) {
      connectAccountWithMetamast();
    }
  }, []);

  return (
    <div className="App">
      <Home
        nft={nft}
        marketplace={marketplace}
        account={account}
        connectAccountWithMetamast={connectAccountWithMetamast}
      />
    </div>
  );
}

export default App;

//make 2 foldres namely frontend and backend
//npm i ipfs-http-client hardhat ethers ethereum-waffle @nomiclabs/hardhat-ethers @nomiclabs/hardhat-waffle @openzeppelin/contracts buffer
//create basic structure to write smartContract with npx hardhat (cd backend) and then istall below dependencies
//npm install --save-dev "hardhat@^2.17.3" "@nomicfoundation/hardhat-toolbox@^3.0.0"
//ERC721 = set of all function that a nft contract should have
//cd backend run npx hardhat node (run local server to test nft) after writing NFT.sol,hardhat config and deploy.js
//run npx hardhat run src/backend/scripts/deploy.js --network localhost
//It creates contractData folder in frontend


//1 to confirm your transaction to mint the nft on blockchain
// 2.Approve the market place to spend the nft
// 3. list the nft on the marketplace


// Deploying contracts with the account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
// Account balance: 10000000000000000000000
// NFT address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
// marketplace address: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
// contractAddress 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
// name Marketplace
// contractsDir C:\Users\ritik\OneDrive\Desktop\practices\nftWithHardhatPractice\nft_with_hardhat\src\backend\scripts/../../frontend/contractsData
// contractAddress 0x5FbDB2315678afecb367f032d93F642f64180aa3
// name NFT
// contractsDir C:\Users\ritik\OneDrive\Desktop\practices\nftWithHardhatPractice\nft_with_hardhat\src\backend\scripts/../../frontend/contractsData