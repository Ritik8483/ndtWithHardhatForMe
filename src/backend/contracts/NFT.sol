// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol"; //ERC721URIStorage is a variant of the ERC721 standard that includes functionality for storing metadata (the URI) associated with each NFT.

contract NFT is
    ERC721URIStorage //This means that NFT is an ERC721 token with additional functionality for storing and retrieving metadata URIs.
{
    uint256 public tokenCount; //keep track of no. of variable (it's stored in blockchain)

    constructor() ERC721("DApp NFT", "DAPP") {} //special function that is called once when the code is deployed on the blockchain,//This is the constructor of the contract. It's called only once when the contract is deployed. It sets up the initial state of the contract. In this case, it calls the constructor of the parent contract ERC721 with the arguments "DApp NFT" (the name of the NFT collection) and "DAPP" (the symbol of the NFT collection).

    function mint(string memory _tokenURI) external returns (uint) {
        //This line declares a function called mint that allows users to create new NFTs. It takes a string argument _tokenURI, which is the URI that points to the metadata of the NFT. The function is declared as external, meaning it can be called from outside the contract.
        tokenCount++; //This line increments the tokenCount variable by 1 each time a new NFT is minted, effectively assigning a unique ID to each NFT
        _safeMint(msg.sender, tokenCount); //This line mints a new NFT and assigns it to the sender's address (msg.sender) with the unique tokenCount as its token ID
        _setTokenURI(tokenCount, _tokenURI); //This line sets the metadata URI for the newly minted NFT. The _setTokenURI function associates the URI with the token ID
        return (tokenCount); //the function returns the token ID of the newly minted NFT, which is the tokenCount
    }
}
