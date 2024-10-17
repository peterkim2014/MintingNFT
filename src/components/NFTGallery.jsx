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

   // Function to fetch metadata from IPFS using Pinata's gateway with authentication headers
    const getMetadataFromIPFS = async (ipfsHash) => {
        const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

        try {
            const response = await axios.get(url, {
                headers: {
                    pinata_api_key: "f75ca3f475cde44d3716",
                    pinata_secret_api_key: "b4e510c005f231de7b91b7e4c335acf0695613e1a06bcfe5989e444a9cede57d",
                }
            });
            return response.data;  // Contains name, description, and image
        } catch (error) {
            console.error("Error fetching metadata from IPFS:", error);
            return null;
        }
    };


    // Function to load NFTs owned by the account
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
                const metadata = await getMetadataFromIPFS(tokenURI.split('/').pop()); // Extract IPFS hash from URI

                if (metadata) {
                    nftData.push({
                        tokenId: tokenId.toString(),
                        name: metadata.name || "Unnamed NFT",  // Default if no name
                        description: metadata.description || "No description",  // Default if no description
                        image: metadata.image || "https://via.placeholder.com/150",  // Placeholder image if no image
                    });
                } else {
                    console.log(`Metadata for tokenID ${tokenId} not found or invalid.`);
                }
            }

            setNFTs(nftData);
        } catch (error) {
            console.error("Error fetching NFTs:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch the NFTs on page load and whenever the account, provider, or contractAddress changes
    useEffect(() => {
        loadNFTs();
    }, []);
    

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
                collection => collection.image_url && !collection.name.toLowerCase().includes("follower") && !collection.name.includes("Reward") && !collection.name.includes("0x")
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



    return (
        <div className="nft-gallery">
            <div className="myNFT-gallery">
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

            </div>

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
