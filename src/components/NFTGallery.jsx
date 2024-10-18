import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../static/NFTGallery.css'; // Ensure you have this CSS for styling

function NFTGallery({ account, provider, contractAddress }) {
    const [collections, setCollections] = useState([]);  // OpenSea collections
    const [loadingCollections, setLoadingCollections] = useState(true);
    const [currentNFT, setCurrentNFT] = useState(0);

    // Function to fetch collection details
    const fetchOpenSeaCollections = async () => {
        setLoadingCollections(true);
        try {
            console.log('Fetching collections from OpenSea...');
            const response = await axios.get('https://api.opensea.io/api/v2/collections', {
                headers: {
                    'accept': 'application/json',
                    'x-api-key': 'b796154723e34b28b881eb99f040a70e',
                },
                params: {
                    limit: 9, // Limit the collections fetched
                }
            });
            console.log('Collections response:', response.data);

            const fetchedCollections = response.data.collections.filter(
                collection => collection.image_url && !collection.name.toLowerCase().includes("follower") && !collection.name.includes("Reward") && collection.owner.includes("0x")
            );
            console.log('Filtered collections:', fetchedCollections);

            // Fetch additional NFT details for each collection after fetching collections
            const updatedCollections = await fetchNFTDetails(fetchedCollections);
            setCollections(updatedCollections);
            console.log('Updated collections with NFT details:', updatedCollections);
        } catch (error) {
            console.error("Error fetching OpenSea collections:", error);
        } finally {
            setLoadingCollections(false);
        }
    };

    // Function to fetch NFT details for each collection
    const fetchNFTDetails = async (collections) => {
        console.log('Fetching NFT details for each collection...');
        const updatedCollections = await Promise.all(
            collections.map(async (collection) => {
                const address = collection.owner;
                const chain = collection.contracts[0]?.chain;
                console.log(`Fetching NFT details for collection ${collection.name} (Address: ${address}, Chain: ${chain})`);

                try {
                    const nftResponse = await axios.get(`https://api.opensea.io/api/v2/chain/${chain}/account/${address}/nfts`, {
                        headers: {
                            'accept': 'application/json',
                            'x-api-key': 'b796154723e34b28b881eb99f040a70e',
                        },
                    });

                    console.log(`NFT response for collection ${collection.name}:`, nftResponse.data);

                    const nftDetails = nftResponse.data.nfts[0]; // Use the first NFT for simplicity

                    // Return the updated collection with NFT details
                    return {
                        ...collection,
                        nftDetails, // Add the NFT details directly to the collection object
                    };
                } catch (error) {
                    console.error(`Error fetching NFT details for collection ${collection.name}:`, error);
                    return collection;  // Return collection even if there was an error
                }
            })
        );
        console.log('Finished fetching NFT details for all collections:', updatedCollections);
        return updatedCollections;
    };

    // Fetch collections on initial load
    useEffect(() => {
        fetchOpenSeaCollections();  // Fetch collections once when the page loads
    }, []);

    // Shift between collections automatically
    useEffect(() => {
        const interval = setInterval(() => {
            if (collections.length > 0) {
                setCurrentNFT((prev) => (prev + 1) % collections.length);
            }
        }, 5000); // Automatically shift every 5 seconds
    
        return () => clearInterval(interval);
    }, [collections.length]);

    return (
        <div className="nft-gallery">
            <div className="nft-info">
                <img src={collections[currentNFT]?.image_url} alt={collections[currentNFT]?.name || 'NFT'} />
                <h3>{collections[currentNFT]?.name || 'NFT'}</h3>
            </div>

            <div className="myNFT-collection">
                <h2>Explore NFT Collections</h2>
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
                                    <div>
                                        <p>More NFT Details:</p>
                                        {!collection.nftDetails ? (
                                            <p>Loading Data...</p>
                                        ) : (
                                        <div>
                                            
                                            <p key={index}>Token Standard: {collection.nftDetails.token_standard.toUpperCase()}</p>
                                            
                                        </div>

                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No collections found on OpenSea.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default NFTGallery;
