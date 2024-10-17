import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import ContractAbi from '../compiledData/contract-abi.json';
import '../static/NFTGallery.css'; // Ensure you have this CSS for styling

function NFTGallery({ account, provider, contractAddress }) {
    const [nfts, setNFTs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadNFTs = async () => {
            if (!account || !provider || !contractAddress) return;

            setLoading(true);
            try {
                const signer = provider.getSigner();
                const nftContract = new ethers.Contract(contractAddress, ContractAbi.abi, signer);

                // Get the balance of NFTs owned by the account
                const balance = await nftContract.balanceOf(account);
                const nftData = [];

                // Loop through each token ID and get its tokenURI
                for (let i = 0; i < balance; i++) {
                    const tokenId = await nftContract.tokenOfOwnerByIndex(account, i);
                    const tokenURI = await nftContract.tokenURI(tokenId);
                    
                    // Fetch the metadata from the tokenURI (assumes it's hosted on IPFS)
                    const metadata = await fetchMetadataFromPinata(tokenURI);

                    if (metadata) {
                        nftData.push({
                            tokenId: tokenId.toString(),
                            name: metadata.name,
                            description: metadata.description,
                            image: metadata.image,
                        });
                    }
                }

                setNFTs(nftData);
            } catch (error) {
                console.error("Error fetching NFTs:", error);
            } finally {
                setLoading(false);
            }
        };

        loadNFTs();
    }, [account, provider, contractAddress]);

    // Function to fetch metadata from Pinata (using IPFS)
    const fetchMetadataFromPinata = async (tokenURI) => {
        try {
            const response = await axios.get(tokenURI);
            return response.data;
        } catch (error) {
            console.error("Error fetching metadata from IPFS:", error);
            return null;
        }
    };

    return (
        <div className="nft-gallery">
            <h2>Your Minted NFTs</h2>
            {loading ? (
                <p>Loading your NFTs...</p>
            ) : (
                <div className="nft-grid">
                    {nfts.map((nft, index) => (
                        <div className="nft-card" key={index}>
                            <img src={nft.image} alt={nft.name} />
                            <h3>{nft.name}</h3>
                            <p>{nft.description}</p>
                            <p>Token ID: {nft.tokenId}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default NFTGallery;
