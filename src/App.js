import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import WalletConnector from './components/WalletConnector';
import NFTContract from './components/NFTContract';
import NFTMinter from './components/NFTMinter';

function App() {
  const [account, setAccount] = useState(null); // State to store the connected account
  const [provider, setProvider] = useState(null); // State to store the provider
  const [contract, setContract] = useState(null); // State to store the contract instance
  const [contractAddress, setContractAddress] = useState(null); // State to store the deployed contract address

  useEffect(() => {
    if (provider) {
      // Load contract information if provider is available
      const loadContract = async () => {
        try {
          // Deploy the contract if not already deployed
          const signer = provider.getSigner();
          const NFTFactory = new ethers.ContractFactory(
            [
              "function mint() public returns (uint256)",
              "constructor() public"
            ],
            "0x608060405234801561001057600080fd5b50610104806100206000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80632a1afcd914602d575b600080fd5b60336047565b604051603e91906070565b60405180910390f35b6000600260005460ff1690565b600060208284031215605c57600080fd5b503591905056fea2646970667358221220b2f9024f0f8ccf537bdf2f3e5f0e624b6bda59a5d56aa36941701d90aeb2086464736f6c63430008100033",
            signer
          );

          const nftContract = await NFTFactory.deploy();
          await nftContract.deployed();

          console.log("NFT Contract deployed at address:", nftContract.address);
          setContract(nftContract);
          setContractAddress(nftContract.address);
        } catch (error) {
          console.error("Error deploying/loading NFT Contract:", error);
        }
      };
      loadContract();
    }
  }, [provider]);

  return (
    <div className="App">
      <h1>Mint Your NFT (Testing Network Only)</h1>
      <WalletConnector setAccount={setAccount} setProvider={setProvider} />
      {account && provider && contract && (
        <>
          <p>Your connected account: {account}</p>
          <p>Contract Address: {contractAddress}</p>
          <NFTMinter account={account} provider={provider} contract={contract} />
        </>
      )}
    </div>
  );
}

export default App;