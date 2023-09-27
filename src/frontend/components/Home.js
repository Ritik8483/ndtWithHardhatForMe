import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { create } from "ipfs-http-client";      //They upload the data to IPFS and receive a content-addressed hash in return. This hash can then be stored on the Ethereum blockchain to reference the data.
import { Buffer } from "buffer";
//users can access it directly by using the hash, and it can be retrieved from any node in the IPFS network.

const Home = ({ nft, marketplace, account, connectAccountWithMetamast }) => {
  const [inputValues, setInputValues] = useState({
    name: "",
    description: "",
    price: "",
  });
  const [listedItems, setListedItems] = useState([]);
  const [soldItems, setSoldItems] = useState([]);
  const [imageInput, setImageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editNft, setEditNft] = useState(false);
  const [editNftId, setEditNftid] = useState("");
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);

  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setInputValues((lastValues) => {
      return {
        ...lastValues,
        [name]: value,
      };
    });
  };

  const auth =
    "Basic " +
    Buffer.from(
      "2Gg95YqQ672apEtGQbewfwGQANc" + ":" + "b2c85789868e83772bfbc59ddd6d09bb"
    ).toString("base64");

  const client = create({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
    headers: {
      authorization: auth,
    },
  });

  const handleImageInputChange = async (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    if (typeof file !== "undefined") {
      try {
        const result = await client.add(file);
        setImageInput(`https://ipfs.io/ipfs/${result.path}`);
      } catch (error) {
        console.log("ipfs image upload error: ", error);
      }
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (editNft) {
      setLoading(true);
      const listingPrice = ethers.utils.parseEther(
        inputValues.price.toString()
      );
      const bigNumber = editNftId;
      const regularNumber = bigNumber.toNumber();
      const finalResponse = await (
        await marketplace.updateNFTPrice(regularNumber, listingPrice)
      ).wait();
      getAllNfts();
      loadListedItems();
    } else {
      setLoading(true);
      const result = await client.add(
        JSON.stringify({ imageInput, ...inputValues })
      );
      const uri = `https://ipfs.io/ipfs/${result.path}`;
      const resp = await nft.mint(uri);
      const waitResp = await resp.wait();
      const id = await nft.tokenCount();
      const appResp = await (
        await nft.setApprovalForAll(marketplace.address, true)
      ).wait();
      const listingPrice = ethers.utils.parseEther(
        inputValues.price.toString()
      );
      const finalResponse = await (
        await marketplace.makeItem(nft.address, id, listingPrice)
      ).wait();
      if (finalResponse?.status) {
        setLoading(false);
        setInputValues({
          name: "",
          description: "",
          price: "",
        });
        setImageInput("");
        getAllNfts();
        loadListedItems();
      }
    }
  };

  const truncatedString = `${account?.slice(0, 4)}...${account?.slice(-4)}`;
  const getAllNfts = async () => {
    const itemCount = await marketplace.itemCount();
    let items = [];
    for (let i = 1; i <= itemCount; i++) {
      const item = await marketplace.items(i);
      console.log("item", item);
      if (!item.sold) {
        //filtering only on the basis of sold nft key i.e T or F
        const uri = await nft.tokenURI(item.tokenId);
        const response = await fetch(uri);

        const metadata = await response.json();
        const totalPrice = await marketplace.getTotalPrice(item.itemId);
        items.push({
          totalPrice,
          itemId: item.itemId,
          seller: item.seller,
          sold: item.sold,
          nft: item.nft,
          name: metadata.name,
          description: metadata.description,
          image: metadata.imageInput,
          price: item.price,
          tokenId: item.tokenId,
        });
      }
    }
    setLoading(false);
    setItems(items);
  };

  useEffect(() => {
    if (marketplace?.address) {
      getAllNfts();
      loadListedItems();
      getAllPurchasedItems();
    }
  }, [marketplace]);

  const buyMarketItem = async (item) => {
    const resp = await (
      await marketplace.purchaseItem(item.itemId, { value: item.totalPrice })
    ).wait();
    if (resp?.blockHash) {
      getAllNfts();
      getAllPurchasedItems();
    }
  };

  const loadListedItems = async () => {
    const itemCount = await marketplace.itemCount();
    let listedItems = [];
    let soldItems = [];
    for (let indx = 1; indx <= itemCount; indx++) {
      const i = await marketplace.items(indx);
      if (i.seller.toLowerCase() === account) {
        //filtering if owner is equal to creator of nft
        const uri = await nft.tokenURI(i.tokenId); //take out data saved on ipfs
        // use uri to fetch the nft metadata stored on ipfs
        const response = await fetch(uri);
        const metadata = await response.json(); //final data
        // get total price of item (item price + fee)
        const totalPrice = await marketplace.getTotalPrice(i.itemId);
        let item = {
          totalPrice,
          itemId: i.itemId,
          name: metadata.name,
          description: metadata.description,
          price: metadata.price,
          image: metadata.imageInput,
        };
        listedItems.push(item);
        if (i.sold) soldItems.push(item);
      }
    }
    setLoading(false);
    setListedItems(listedItems);
    setSoldItems(soldItems);
  };

  const getAllPurchasedItems = async () => {
    const filter = marketplace.filters.Bought(
      null,
      null,
      null,
      null,
      null,
      account
    );
    const results = await marketplace.queryFilter(filter);
    const purchases = await Promise.all(
      results.map(async (i) => {
        i = i.args;
        const uri = await nft.tokenURI(i.tokenId);
        const response = await fetch(uri);
        const metadata = await response.json();
        const totalPrice = await marketplace.getTotalPrice(i.itemId);
        let purchasedItem = {
          totalPrice,
          itemId: i.itemId,
          seller: i.seller,
          name: metadata.name,
          description: metadata.description,
          price: metadata.price,
          image: metadata.imageInput,
        };
        return purchasedItem;
      })
    );
    setPurchases(purchases);
  };

  const handleChangePrice = (item, etherValue) => {
    setInputValues({
      name: item.name,
      description: item.description,
      price: etherValue,
    });
    setEditNftid(item?.itemId);
    setEditNft(true);
  };

  const deleteNft = async (item) => {
    console.log("item", item);
    const bigNumber = item?.tokenId;
    const regularNumber = bigNumber?.toNumber();
    console.log("regularNumber", regularNumber);
    const finalResponse = await (
      await marketplace.deleteNftFromMarket(regularNumber, item?.seller)
    ).wait();
    console.log("finalResponse", finalResponse);
    getAllNfts();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "20px",
      }}
    >
      {account ? (
        <h5>{truncatedString}</h5>
      ) : (
        <button onClick={connectAccountWithMetamast}>Connect Wallet</button>
      )}
      {account && (
        <form
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          onSubmit={handleSubmitForm}
        >
          <input
            disabled={editNft}
            type="file"
            onChange={handleImageInputChange}
          />
          <input
            type="text"
            disabled={editNft}
            name="name"
            value={inputValues.name}
            onChange={handleChange}
            placeholder="Enter Nft name"
          />
          <input
            type="textarea"
            disabled={editNft}
            name="description"
            value={inputValues.description}
            onChange={handleChange}
            placeholder="Enter Nft description"
          />
          <input
            type="number"
            name="price"
            value={inputValues.price}
            onChange={handleChange}
            placeholder="Enter Nft price"
          />
          <button disabled={loading} type="submit">
            {editNft
              ? "Update NFT"
              : loading && editNft
              ? "Upating..."
              : loading
              ? "Submitting..."
              : "Submit"}
          </button>
        </form>
      )}
      <h2>Available NFT's to buy</h2>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        {items?.length === 0 ? (
          <h1>No items found</h1>
        ) : (
          items?.map((item) => {
            const hexValue = item?.price;
            const bigNumber = ethers.BigNumber.from(hexValue);
            const etherValue = ethers.utils.formatEther(bigNumber);
            return (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid black",
                  width: "300px",
                }}
              >
                <img
                  style={{ objectFit: "cover" }}
                  height="250"
                  width="300"
                  src={item.image}
                  alt="nftImage"
                />
                <h2>
                  Seller :{" "}
                  {account === item?.seller?.toLowerCase()
                    ? "Account Owner"
                    : `${item.seller?.slice(0, 4)}...${item.seller?.slice(-4)}`}
                </h2>
                <h5 style={{ margin: "0" }}>Nft : {item.name}</h5>
                <h5 style={{ margin: "0" }}>
                  Sold Status : {item.sold ? "Sold" : "Unsold"}
                </h5>
                <h5 style={{ margin: "0" }}>Price : {etherValue} ETH</h5>
                <p style={{ margin: "0" }}>Description : {item.description}</p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    margin: "10px 0",
                    justifyContent: "center",
                  }}
                >
                  <button
                    disabled={
                      account === item?.seller?.toLowerCase() ? false : true
                    }
                    onClick={() => handleChangePrice(item, etherValue)}
                  >
                    Chanage Price
                  </button>
                  <button
                    onClick={() => buyMarketItem(item)}
                    disabled={
                      account === item?.seller?.toLowerCase() ? true : false
                    }
                  >
                    Purchase
                  </button>
                  <button
                    onClick={() => deleteNft(item)}
                    disabled={
                      account === item?.seller?.toLowerCase() ? false : true
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div>
        <h2>My Sold NFT's</h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          {soldItems?.length === 0 ? (
            <h1>No items found</h1>
          ) : (
            soldItems?.map((item) => {
              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    border: "1px solid black",
                    width: "300px",
                  }}
                >
                  <img
                    style={{ objectFit: "cover" }}
                    height="250"
                    width="300"
                    src={item.image}
                    alt="nftImage"
                  />
                  <h5 style={{ margin: "0" }}>NFT : {item.name}</h5>
                  <h5 style={{ margin: "0" }}>Price : {item.price} ETH</h5>
                  <p style={{ margin: "0" }}>
                    Description : {item.description}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div>
        <h2>My Purchased NFT's</h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          {purchases?.length === 0 ? (
            <h1>No items found</h1>
          ) : (
            purchases?.map((item) => {
              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    border: "1px solid black",
                    width: "300px",
                  }}
                >
                  <img
                    style={{ objectFit: "cover" }}
                    height="250"
                    width="300"
                    src={item.image}
                    alt="nftImage"
                  />
                  <h5 style={{ margin: "0" }}>
                    Seller :{" "}
                    {`${item.seller?.slice(0, 4)}...${item.seller?.slice(-4)}`}
                  </h5>
                  <h5 style={{ margin: "0" }}>NFT : {item.name}</h5>
                  <h5 style={{ margin: "0" }}>Price : {item.price} ETH</h5>
                  <p style={{ margin: "0" }}>
                    Description : {item.description}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div>
        <h2>My Listed NFT's</h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          {listedItems?.length === 0 ? (
            <h1>No items found</h1>
          ) : (
            listedItems?.map((item) => {
              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    border: "1px solid black",
                    width: "300px",
                  }}
                >
                  <img
                    style={{ objectFit: "cover" }}
                    height="250"
                    width="300"
                    src={item.image}
                    alt="nftImage"
                  />
                  <h5 style={{ margin: "0" }}>NFT : {item.name}</h5>
                  {/* <h5 style={{ margin: "0" }}>Price : {item.price} ETH</h5> */}
                  <p style={{ margin: "0" }}>
                    Description : {item.description}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
