import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../static/NFTGallery.css'; // Ensure you have this CSS for styling

function NFTGallery({ account, provider, contractAddress }) {
    const [collections, setCollections] = useState([]);  // OpenSea collections
    const [loadingCollections, setLoadingCollections] = useState(true);
    const [currentNFT, setCurrentNFT] = useState(0);
    const [timeOutState, setTimeOutState] = useState({}); // State to track timeouts
    const [copyStatus, setCopyStatus] = useState({});

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
                    limit: 50, // Limit the collections fetched
                }
            });
            console.log('Collections response:', response.data);

            const fetchedCollections = response.data.collections.filter(
                collection => collection.image_url && !collection.name.toLowerCase().includes("follower") && !collection.name.includes("Reward") && collection.owner.includes("0x") && !collection.name.includes("0x") && !collection.name.includes("REWARD")
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
                    // First API call: Fetch NFT details for this collection
                    const nftResponse = await axios.get(`https://api.opensea.io/api/v2/chain/${chain}/account/${address}/nfts`, {
                        headers: {
                            'accept': 'application/json',
                            'x-api-key': 'b796154723e34b28b881eb99f040a70e',
                        },
                    });

                    console.log(`NFT response for collection ${collection.name}:`, nftResponse.data);

                    const nftDetails = nftResponse.data.nfts[0]; // Use the first NFT for simplicity
                    const nftIdentifier = nftDetails.identifier; // Assuming identifier is available in the response
                    const contractAddress = nftDetails.contract;

                    // Second API call: Fetch more detailed metadata using the identifier, contract, and chain
                    const detailedNftResponse = await axios.get(`https://api.opensea.io/api/v2/chain/${chain}/contract/${contractAddress}/nfts/${nftIdentifier}`, {
                        headers: {
                            'accept': 'application/json',
                            'x-api-key': 'b796154723e34b28b881eb99f040a70e',
                        },
                    });

                    console.log(`Detailed NFT data for identifier ${nftIdentifier}:`, detailedNftResponse.data);

                    const detailedNftData = detailedNftResponse.data.nft;

                    // Return the updated collection with both basic and detailed NFT details
                    return {
                        ...collection,
                        nftDetails: {
                            ...nftDetails,
                            detailedNftData, // Add detailed NFT data to the collection object
                        },
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

    // Timeout handler to set "No data available" after 5 seconds
    useEffect(() => {
        collections.forEach((collection, index) => {
            if (!collection.nftDetails) {
                const timeoutId = setTimeout(() => {
                    setTimeOutState((prev) => ({
                        ...prev,
                        [index]: true, // Mark as timed out
                    }));
                }, 5000); // Timeout for 5 seconds

                return () => clearTimeout(timeoutId); // Cleanup on unmount
            }
            if (!collection.nftDetails.detailedNftData.creator) {
                const timeoutId = setTimeout(() => {
                    setTimeOutState((prev) => ({
                        ...prev,
                        [index]: true, // Mark as timed out
                    }));
                }, 5000); // Timeout for 5 seconds

                return () => clearTimeout(timeoutId); // Cleanup on unmount
            }
        });
    }, [collections]);

    const truncateText = (text, maxLength) => {
        if (!text) return '';
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    };
    // Function to handle copying to clipboard
    const copyToClipboard = (text, key) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setCopyStatus(prev => ({ ...prev, [key]: 'Copied' }));

                // Revert back to "Click to copy" after 7 seconds
                setTimeout(() => {
                    setCopyStatus(prev => ({ ...prev, [key]: 'Click to copy' }));
                }, 7000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    };

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
                                <div className="nft-card-inner">
                                    <div className="nft-card-front">
                                        {collection.image_url ? (
                                            <img src={collection.image_url} alt={collection.name} />
                                        ) : (
                                            <p>No image available</p>
                                        )}
                                        <h3>{collection.name}</h3>
                                    </div>
                                    <div className="nft-card-back">
                                        <h4>{collection.name}</h4>
                                        <p>NFT Details</p>
                                        {collection.nftDetails ? (
                                            <div className="nft-details">
                                                <p><strong>Token Standard:</strong> {collection.nftDetails.token_standard.toUpperCase()}</p>
                                                {collection.nftDetails.detailedNftData.creator ? (
                                                    <p onClick={() => copyToClipboard(collection.nftDetails.detailedNftData.creator, `creator-${index}`)} className="copyable">
                                                    <strong>Creator:</strong> {truncateText(collection.nftDetails.detailedNftData.creator, 15)}
                                                    <span className="copy-indicator"> ({copyStatus[`creator-${index}`] || 'Click to copy'})</span>
                                                </p>
                                                ) : timeOutState[index] ? (
                                                    <p>No data available</p>
                                                ) : (
                                                    <p>Loading Data...</p>
                                                )}
                                                {collection.nftDetails?.detailedNftData?.owners?.length > 0 && (
                                                    <p onClick={() => copyToClipboard(collection.nftDetails.detailedNftData.owners.slice(-1)[0].address, `owner-${index}`)} className="copyable">
                                                    <strong>Last Owner:</strong> {truncateText(collection.nftDetails.detailedNftData.owners.slice(-1)[0].address, 15)}
                                                    <span className="copy-indicator"> ({copyStatus[`owner-${index}`] || 'Click to copy'})</span>
                                                </p>
                                                )}
                                                <a href={collection.opensea_url} target="_blank" rel="noopener noreferrer">
                                                    View on OpenSea
                                                </a>
                                            </div>
                                        ) : timeOutState[index] ? (
                                            <p>No data available</p>
                                        ) : (
                                            <p>Loading Data...</p>
                                        )}
                                    </div>
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
