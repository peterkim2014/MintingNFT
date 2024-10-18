import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import WalletConnector from './components/WalletConnector';
import NFTMinter from './components/NFTMinter';
import NFTGallery from './components/NFTGallery';
// import Contract from './compiledData/contract.json';
import Contract from './compiledData/contract2.json';
import './App.css';

function App() {
  const [account, setAccount] = useState(null); // State to store the connected account
  const [provider, setProvider] = useState(null); // State to store the provider
  const [contract, setContract] = useState(null); // State to store the contract instance
  const [contractAddress, setContractAddress] = useState(""); // State to store the deployed contract address
  const [balance, setBalance] = useState(null); // State to store the account balance

  useEffect(() => {
    if (provider) {
      const loadContract = async () => {
        try {
          const signer = provider.getSigner();

          // Make sure you're using correct ABI and bytecode
          const nftFactory = new ethers.ContractFactory(
            [
              "function mint(address to, string memory tokenURI) public returns (uint256)",
              "constructor() public"
            ], // Use correct ABI from compiled contract JSON
            Contract.Contract, // Use correct bytecode
            signer
          );

          // Estimate gas price and limit
          // const gasPrice = await provider.getGasPrice();
          // console.log("Gas Price:", ethers.utils.formatUnits(gasPrice, "gwei"), "gwei");

          // Deploy the contract with estimated gas
          const nftContract = await nftFactory.deploy();

          await nftContract.deployed();

          console.log("NFT Contract deployed at address:", nftContract.address);
          localStorage.setItem('contractAddress', nftContract.address);
          setContract(nftContract);
          setContractAddress(nftContract.address);
        } catch (error) {
          console.error("Error deploying/loading NFT Contract:", error);
        }
      };
      loadContract();
    }
  }, [provider]);

  useEffect(() => {
    // if (account) {
      const loadBalance = async () => {
        try {
          const balanceBigNumber = await provider.getBalance(account);
          const balanceInEth = ethers.utils.formatEther(balanceBigNumber);
          setBalance(balanceInEth);
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      };
      loadBalance();
    // }
  }, []);

  return (
    <div className="App">
      <div className="background-3d">
        <div className="bg-circle"></div>
        <div className="bg-circle"></div>
        <div className="bg-circle"></div>
      </div>
      
      <h1 className="animated-title">Mint Your NFT (Test Network)</h1>
      <WalletConnector setAccount={setAccount} setProvider={setProvider} />
      {account && provider && (
        <div className="account-info">
          <p>Your connected account: {account}</p>
          {balance !== null && <p>Account Balance: {balance} ETH</p>}
          <p>Contract Address: {contractAddress ? contractAddress : "Not deployed yet"}</p>
        </div>
      )}

      
      {account && provider && contract && <NFTMinter account={account} provider={provider} contract={contract} />}
      <NFTGallery account={account} provider={provider} contractAddress={contractAddress} />
    </div>
  );
}

export default App;
