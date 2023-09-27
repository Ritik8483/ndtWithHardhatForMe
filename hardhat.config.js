require("@nomiclabs/hardhat-waffle");

module.exports = {
  //This line begins the export of the configuration object that will define the settings for your Hardhat environment.
  solidity: "0.8.9",
  paths: {
    artifacts: "./src/backend/artifacts", //artifacts will be placed in the ./src/backend/artifacts
    sources: "./src/backend/contracts",
    cache: "./src/backend/cache",
    tests: "./src/backend/test",
  },
};
