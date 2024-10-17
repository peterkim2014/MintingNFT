import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import ContractAbi from '../compiledData/contract-abi.json';
import '../static/NFTGallery.css'; // Ensure you have this CSS for styling

function NFTGallery({ account, provider, contractAddress }) {
    const [nfts, setNFTs] = useState([]);  // User-owned NFTs
    const [collections, setCollections] = useState([]);  // OpenSea collections
    const [loading, setLoading] = useState(true);
    const [loadingCollections, setLoadingCollections] = useState(true);

    // Fetch the user's NFTs
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

    // Function to fetch 90 collections from OpenSea
    const fetchOpenSeaCollections = async () => {
        setLoadingCollections(true);
        try {
            const response = await axios.get('https://api.opensea.io/api/v2/collections', {
                headers: {
                    'accept': 'application/json',
                    'x-api-key': 'b796154723e34b28b881eb99f040a70e', // Use your OpenSea API key here
                },
                params: {
                    limit: 90,  // Fetch 90 collections
                    include_hidden: false,
                    order_by: 'created_date'
                }
            });

            let fetchedCollections = response.data.collections;

            // Filter collections: only those with image_url and no "follower" in the name
            const filteredCollections = fetchedCollections.filter(
                collection => collection.image_url && !collection.name.toLowerCase().includes("follower")
            );

            // Avoid duplicates: Create a Set to track unique names
            const uniqueNames = new Set();
            const uniqueCollections = filteredCollections.filter(collection => {
                if (!uniqueNames.has(collection.name)) {
                    uniqueNames.add(collection.name);
                    return true;
                }
                return false;
            });

            // Select the first 10 collections after filtering
            const finalCollections = uniqueCollections.slice(0, 10);

            // Update the state with the valid collections
            setCollections(finalCollections);

        } catch (error) {
            console.error("Error fetching OpenSea collections:", error);
        } finally {
            setLoadingCollections(false);
        }
    };

    // Fetch collections on initial load
    useEffect(() => {
        fetchOpenSeaCollections();  // Fetch collections once when the page loads
    }, []);  // Only run this effect once on mount

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
                    {nfts.length > 0 ? (
                        nfts.map((nft, index) => (
                            <div className="nft-card" key={index}>
                                <img src={nft.image} alt={nft.name} />
                                <h3>{nft.name}</h3>
                                <p>{nft.description}</p>
                                <p>Token ID: {nft.tokenId}</p>
                            </div>
                        ))
                    ) : (
                        <p>No NFTs found in your wallet.</p>
                    )}
                </div>
            )}

            <h2>OpenSea Collections</h2>
            {loadingCollections ? (
                <p>Loading OpenSea collections...</p>
            ) : (
                <div className="nft-grid">
                    {collections.length > 0 ? (
                        collections.map((collection, index) => (
                            <div className="nft-card" key={index}>
                                {collection.image_url ? (
                                    <img src={collection.image_url} alt={collection.name} />
                                ) : (
                                    <p>No image available</p>
                                )}
                                <h3>{collection.name}</h3>
                                <a href={collection.opensea_url} target="_blank" rel="noopener noreferrer">
                                    View on OpenSea
                                </a>
                            </div>
                        ))
                    ) : (
                        <p>No collections found on OpenSea.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default NFTGallery;
