// WalletConnector.js
import React from 'react';
import { ethers } from 'ethers';

function WalletConnector({ setAccount, setProvider, triggerAnimation }) {
  // Function to connect to MetaMask
  const connectWallet = async () => {
    console.log('Attempting to connect to MetaMask...');

    // Check if MetaMask is installed
    if (window.ethereum) {
      console.log('MetaMask is installed.');
      try {
        // Try different provider initializations
        let provider;
        if (window.ethereum.providers?.length) {
          // If multiple providers are detected
          window.ethereum.providers.forEach((p) => {
            console.log("Providers list: ", p)
            if (p.isMetaMask) {
              provider = new ethers.providers.Web3Provider(p);
            }
          });
        } else {
          provider = new ethers.providers.Web3Provider(window.ethereum);
        }

        if (!provider) {
          throw new Error('No MetaMask provider found.');
        }

        console.log("Provider: ", provider);
        setProvider(provider); // Store the provider

        // Request account access
        await provider.send('eth_requestAccounts', []);
        const signer = provider.getSigner();
        const accountAddress = await signer.getAddress();
        setAccount(accountAddress); // Store the account address
        console.log('Successfully connected account:', accountAddress);
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else if (window.web3) {
      // Legacy dapp browsers
      console.log('Legacy web3 provider found.');
      const provider = new ethers.providers.Web3Provider(window.web3.currentProvider);
      try {
        setProvider(provider); // Store the provider
        const signer = provider.getSigner();
        const accountAddress = await signer.getAddress();
        setAccount(accountAddress);
        console.log('Successfully connected account:', accountAddress);
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else {
      console.error('MetaMask is not installed.');
      alert('Please install MetaMask!');
    }
  };

  return (
    <button onClick={connectWallet}>
      Connect Wallet
    </button>
  );
}

export default WalletConnector;
