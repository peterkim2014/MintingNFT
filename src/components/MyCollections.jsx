import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ContractAbi from '../compiledData/contract-abi2.json';

const MyCollections = ({ account, contract, provider, latestBlock }) => {
  const [ownedTokens, setOwnedTokens] = useState([]);
  const [nftImages, setNftImages] = useState([]);

  useEffect(() => {
    const fetchUserNFTs = async () => {
      try {
        const owned = await contract.tokensOwnedBy(account);
        setOwnedTokens(owned.map((tokenId) => tokenId.toString()));

        // Fetch metadata and then the image from Pinata
        const imagePromises = owned.map(async (tokenId) => {
          // Step 1: Get the metadata URI from the contract
          const tokenURI = await contract.tokenURI(tokenId);
          console.log(`Token ${tokenId} metadata URI: ${tokenURI}`);

          // Step 2: Fetch the metadata JSON from IPFS (via Pinata)
          const metadataResponse = await fetch(tokenURI); // IPFS link stored in tokenURI
          const metadata = await metadataResponse.json();

          // Step 3: Get the image URI from the metadata
          const imageURI = metadata.image;

          // Step 4: Fetch the actual image file from Pinata
          const pinataImageURL = `https://gateway.pinata.cloud/ipfs/${imageURI.split('ipfs://')[1]}`;
          const imageResponse = await fetch(pinataImageURL);
          const imageBlob = await imageResponse.blob();

          // Create an object URL for the image so it can be displayed
          return URL.createObjectURL(imageBlob);
        });

        // Resolve all image URLs and store them
        const images = await Promise.all(imagePromises);
        setNftImages(images);
      } catch (error) {
        console.error('Error fetching NFTs or metadata:', error);
      }
    };

    if (account && contract) {
      fetchUserNFTs();
    }
  }, [account, contract, latestBlock]);

  return (
    <div className="my-collections">
      <h2>My NFT Collections</h2>
      <div className="nft-section">
        <h3>Currently Owned NFTs</h3>
        {nftImages.length > 0 ? (
          <ul>
            {nftImages.map((imageURI, index) => (
              <li key={index}>
                <img src={imageURI} alt={`NFT ${ownedTokens[index]}`} style={{ width: '150px', height: '150px' }} />
                <p>Token ID: {ownedTokens[index]}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No NFTs owned currently.</p>
        )}
      </div>
    </div>
  );
};

export default MyCollections;
