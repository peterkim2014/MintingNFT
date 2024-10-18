import React, { useState, useEffect, useRef } from 'react';
import AvatarEditor from 'react-avatar-editor';
import { pinJSONToIPFS } from '../utils/pinata';
import { ethers } from 'ethers';
import ContractAbi from '../compiledData/contract-abi2.json';
import { handleImageUpload } from './handleNFTUpload';
import '../static/NFTMinterConsole.css'; // Create a custom CSS file for styling the console

function NFTMinter({ account, provider, contractAddress }) {
    const [minting, setMinting] = useState(false);
    const [txHash, setTxHash] = useState(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [editedImage, setEditedImage] = useState(null); // Store the edited image
    const [scale, setScale] = useState(1);
    const [rotate, setRotate] = useState(0);
    const [consoleOutput, setConsoleOutput] = useState([]); // To log actions like a console
    const [currentContractAddress, setCurrentContractAddress] = useState(contractAddress);

    const editorRef = useRef(null);

    useEffect(() => {
        const savedContractAddress = localStorage.getItem('contractAddress');
        if (savedContractAddress) {
            setCurrentContractAddress(savedContractAddress);
        }
    }, []);

    const logToConsole = (message) => {
        setConsoleOutput(prevOutput => [...prevOutput, message]);
    };

    const handleSave = () => {
        if (editorRef.current) {
            const canvas = editorRef.current.getImage().toDataURL();
            setEditedImage(canvas); // Save edited image
            logToConsole('Image edited successfully');
        }
    };

    const mintNFT = async () => {
        if (!account) {
            logToConsole('Error: Please connect your wallet first!');
            return;
        }
        if (!name || !description || !editedImage) {
            logToConsole("Error: Missing information (Name, Description, Edited Image).");
            return;
        }

        logToConsole('Minting NFT...');
        setMinting(true);

        // Convert edited image to a file blob
        const response = await fetch(editedImage);
        const blob = await response.blob();
        const imageFile = new File([blob], 'nft_image.png', { type: 'image/png' });

        // Upload image to IPFS using handleImageUpload
        const imageResponse = await handleImageUpload(imageFile);
        if (!imageResponse.success) {
            logToConsole('Error: Failed to upload image to IPFS.');
            setMinting(false);
            return;
        }

        const imageURI = imageResponse.ipfsLink;
        logToConsole(`Image uploaded to IPFS: ${imageURI}`);

        const metadata = {
            name: name,
            description: description,
            image: imageURI,
        };

        const metadataResponse = await pinJSONToIPFS(metadata);
        if (!metadataResponse.success) {
            logToConsole('Error: Failed to pin metadata to IPFS.');
            setMinting(false);
            return;
        }

        const metadataURI = metadataResponse.pinataUrl;
        logToConsole(`Metadata pinned to IPFS: ${metadataURI}`);

        try {
            if (!currentContractAddress) {
                throw new Error("Invalid contract address. Please deploy the contract first.");
            }

            const signer = provider.getSigner();
            const nftContract = new ethers.Contract(currentContractAddress, ContractAbi.abi, signer);

            const tx = await nftContract.mint(account, metadataURI);

            logToConsole(`Transaction sent: ${tx.hash}`);
            setTxHash(tx.hash);

            await tx.wait();
            logToConsole(`Transaction confirmed: ${tx.hash}`);
        } catch (error) {
            logToConsole(`Error: ${error.message}`);
        } finally {
            setMinting(false);
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setImageFile(file);
        logToConsole(`Image selected: ${file.name}`);
    };

    return (
        <div className="nft-minter-console">
            <div className="console-window">
                <div className="console-output">
                    {consoleOutput.map((log, index) => (
                        <p key={index} className="console-log">{log}</p>
                    ))}
                </div>
            </div>

            <div className="console-inputs">
                <input
                    type="text"
                    placeholder="NFT Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="console-input"
                />
                <input
                    type="text"
                    placeholder="NFT Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="console-input"
                />
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="console-file-input"
                />
                
                {imageFile && (
                    <div className="editor-wrapper">
                        <AvatarEditor
                            ref={editorRef}
                            image={imageFile}
                            width={250}
                            height={250}
                            border={50}
                            scale={scale}
                            rotate={rotate}
                        />
                        <div className="editor-controls">
                            <label>Scale: </label>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                step="0.1"
                                value={scale}
                                onChange={(e) => setScale(parseFloat(e.target.value))}
                            />
                            <label>Rotate: </label>
                            <input
                                type="range"
                                min="0"
                                max="360"
                                value={rotate}
                                onChange={(e) => setRotate(parseInt(e.target.value))}
                            />
                            <button onClick={handleSave} className="console-button">
                                Save Edits
                            </button>
                        </div>
                    </div>
                )}

                <button onClick={mintNFT} disabled={minting} className="console-button">
                    {minting ? 'Minting...' : 'Mint NFT'}
                </button>
                {txHash && <p>Transaction Hash: <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer">{txHash}</a></p>}
            </div>
        </div>
    );
}

export default NFTMinter;
