// MyCollections.jsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ContractAbi from '../compiledData/contract-abi2.json';

const MyCollections = ({ account, contract, provider, latestBlock }) => {
  const [mintedTokens, setMintedTokens] = useState([]);
  const [ownedTokens, setOwnedTokens] = useState([]);
  const [previouslyOwnedTokens, setPreviouslyOwnedTokens] = useState([]);

  useEffect(() => {
    if (account && contract) {
      const fetchUserNFTs = async () => {
        const signer = provider.getSigner();
        const nftContract = new ethers.Contract(contract, ContractAbi.abi, signer);

        try {
          // Fetch all NFTs minted by the user
          const minted = await nftContract.tokensMintedBy(account);
          setMintedTokens(minted.map((tokenId) => tokenId.toString()));

          // Fetch all NFTs currently owned by the user
          const owned = await nftContract.tokensOwnedBy(account);
          setOwnedTokens(owned.map((tokenId) => tokenId.toString()));

          // Fetch all NFTs previously owned by the user
          const previouslyOwned = await nftContract.tokensPreviouslyOwnedBy(account);
          setPreviouslyOwnedTokens(previouslyOwned.map((tokenId) => tokenId.toString()));
        } catch (error) {
          console.error('Error fetching NFTs:', error);
        }
      };

      fetchUserNFTs();
    }
  }, [account, latestBlock]);

  return (
    <div className="my-collections">
      <h2>My NFT Collections</h2>

      {/* Display Minted NFTs */}
      <div className="nft-section">
        <h3>Minted NFTs</h3>
        {mintedTokens.length > 0 ? (
          <ul>
            {mintedTokens.map((tokenId) => (
              <li key={tokenId}>Token ID: {tokenId}</li>
            ))}
          </ul>
        ) : (
          <p>No NFTs minted yet.</p>
        )}
      </div>

      {/* Display Currently Owned NFTs */}
      <div className="nft-section">
        <h3>Currently Owned NFTs</h3>
        {ownedTokens.length > 0 ? (
          <ul>
            {ownedTokens.map((tokenId) => (
              <li key={tokenId}>Token ID: {tokenId}</li>
            ))}
          </ul>
        ) : (
          <p>No NFTs owned currently.</p>
        )}
      </div>

      {/* Display Previously Owned NFTs */}
      <div className="nft-section">
        <h3>Previously Owned NFTs</h3>
        {previouslyOwnedTokens.length > 0 ? (
          <ul>
            {previouslyOwnedTokens.map((tokenId) => (
              <li key={tokenId}>Token ID: {tokenId}</li>
            ))}
          </ul>
        ) : (
          <p>No NFTs previously owned.</p>
        )}
      </div>
    </div>
  );
};

export default MyCollections;
