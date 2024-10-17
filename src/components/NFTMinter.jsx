import React, { useState, useEffect } from 'react';
import { pinJSONToIPFS } from '../utils/pinata';
import { ethers } from 'ethers';
import ContractAbi from '../compiledData/contract-abi2.json';
import { handleImageUpload } from './handleNFTUpload';

function NFTMinter({ account, provider, contractAddress }) {
    const [minting, setMinting] = useState(false);
    const [txHash, setTxHash] = useState(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [currentContractAddress, setCurrentContractAddress] = useState(contractAddress);

    useEffect(() => {
        // Load contract address from local storage if available
        const savedContractAddress = localStorage.getItem('contractAddress');
        if (savedContractAddress) {
            setCurrentContractAddress(savedContractAddress);
        }
    }, []);

    const mintNFT = async () => {
        // Basic input validation
        if (!account) {
            // alert('Please connect your wallet first!');
            return;
        }
        if (!name || !description || !imageFile) {
            // alert("Please provide all the necessary information (Name, Description, Image File)");
            return;
        }

        console.log('Minting NFT...');
        setMinting(true);

        // Upload image to IPFS using handleImageUpload
        const imageResponse = await handleImageUpload(imageFile);
        if (!imageResponse.success) {
            // alert('Failed to upload image to IPFS');
            setMinting(false);
            return;
        }

        const imageURI = imageResponse.ipfsLink;
        console.log('Image URI:', imageURI);

        // Prepare metadata
        const metadata = {
            name: name,
            description: description,
            image: imageURI, // Use the IPFS link as the image URL
        };

        // Pin metadata to IPFS using Pinata
        const response = await pinJSONToIPFS(metadata);
        if (!response.success) {
            // alert('Failed to pin metadata to IPFS');
            setMinting(false);
            return;
        }

        const metadataURI = response.pinataUrl;
        console.log('Metadata URI:', metadataURI);

        try {
            // Create a contract instance using the provided contract address
            if (!currentContractAddress) {
                throw new Error("Invalid contract address. Please deploy the contract first.");
            }

            const signer = provider.getSigner();
            const nftContract = new ethers.Contract(currentContractAddress, ContractAbi.abi, signer);

            // Prepare the Ethereum transaction
            const tx = await nftContract.mint(account, metadataURI);

            console.log('Transaction sent:', tx.hash);
            setTxHash(tx.hash);
            // alert(`NFT Minted Successfully! Transaction Hash: ${tx.hash}`);

            // Wait for transaction confirmation
            await tx.wait();
            console.log('Transaction confirmed:', tx.hash);

        } catch (error) {
            console.error('Error minting NFT:', error);
            // alert(`Error: ${error.message}`);
        } finally {
            setMinting(false);
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setImageFile(file);
    };

    return (
        <div>
            <input
                type="text"
                placeholder="NFT Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                type="text"
                placeholder="NFT Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
            />
            <button onClick={mintNFT} disabled={minting}>
                {minting ? 'Minting...' : 'Mint NFT'}
            </button>
            {txHash && <p>Transaction Hash: <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer">{txHash}</a></p>}
        </div>
    );
}

export default NFTMinter;
