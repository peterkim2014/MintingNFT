// NFTMinter.js
import React, { useState } from 'react';
import { ethers } from 'ethers';

function NFTMinter({ account, provider, contract }) {
  const [minting, setMinting] = useState(false);
  const [txHash, setTxHash] = useState(null);

  const mintNFT = async () => {
    if (!account) {
      alert('Please connect your wallet first!');
      return;
    }

    console.log('Minting NFT...');
    setMinting(true);

    try {
        // Send mint transaction (testing only, no actual value involved)
        const tx = await contract.mint();
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
