// NFTMinter.js
import React, { useState } from 'react';
import { ethers } from 'ethers';

function NFTMinter({ account, provider }) {
  const [minting, setMinting] = useState(false);
  const [txHash, setTxHash] = useState(null);

  // Function to mint an NFT
  const mintNFT = async () => {
    if (!account) {
      alert('Please connect your wallet first!');
      return;
    }

    console.log('Minting NFT...');
    setMinting(true);

    try {
      // Use the existing provider and signer
      const signer = provider.getSigner();

      // Example contract address and ABI (replace with your own contract details)
      const contractAddress = '0xYourContractAddressHere'; // Replace with actual contract address
      const contractABI = [
        "function mint() public returns (uint256)"
      ];

      // Create contract instance
      const nftContract = new ethers.Contract(contractAddress, contractABI, signer);

      // Send mint transaction (testing only, no actual value involved)
      const tx = await nftContract.mint();
      console.log('Transaction sent:', tx.hash);
      setTxHash(tx.hash);

      // Wait for transaction to be mined
      await tx.wait();
      console.log('Transaction confirmed:', tx.hash);
    } catch (error) {
      console.error('Error minting NFT:', error);
    } finally {
      setMinting(false);
    }
  };

  return (
    <div>
      <button onClick={mintNFT} disabled={minting}>
        {minting ? 'Minting...' : 'Mint NFT'}
      </button>
      {txHash && <p>Transaction Hash: {txHash}</p>}
    </div>
  );
}

export default NFTMinter;