import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCopy, FaCheck } from 'react-icons/fa'; // Importing copy and check icons
import '../static/AccountDetails.css';
import { ethers } from 'ethers';

const ETHERSCAN_API_KEY = 'D54MR6FMGII7MHBY22VHI9GKQAIGI9EHB5'; // Replace with your actual Etherscan API key

function AccountDetails({ account, provider, balance, network, latestBlock }) {
  const [transactionCount, setTransactionCount] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [nftTransfers, setNFTTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copyStatus, setCopyStatus] = useState({}); // State to track copy status for each item

  // Define network URLs
  const networkUrls = {
    Mainnet: 'https://api.etherscan.io/api',
    // Goerli: 'https://api-goerli.etherscan.io/api',
    Sepolia: 'https://api-sepolia.etherscan.io/api'
  };

  useEffect(() => {
    const fetchAccountDetails = async () => {
      if (account) {
        try {
          // Fetch Transaction History and Count
          const txResponse = await axios.get(
            `${networkUrls[network]}?module=account&action=txlist&address=${account}&startblock=0&endblock=99999999&page=1&offset=999&sort=desc&apikey=${ETHERSCAN_API_KEY}`
          );
          setTransactionHistory(txResponse.data.result.slice(0, 20)); // Limiting to 20 transactions for now
          setTransactionCount(txResponse.data.result.length);

          // Fetch NFT Transfers (ERC-721)
          const nftResponse = await axios.get(
            `${networkUrls[network]}?module=account&action=tokennfttx&address=${account}&page=1&offset=10&sort=desc&apikey=${ETHERSCAN_API_KEY}`
          );
          setNFTTransfers(nftResponse.data.result);

          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching account details:", error);
        }
      }
    };

    fetchAccountDetails();
  }, [latestBlock]);

  // Helper function to determine method based on transaction data
  const getMethod = (tx) => {
    if (!tx.to) {
      return "Contract Creation"; // When 'to' address is null, it's a contract creation
    } else if (tx.input && tx.input !== '0x') {
      // If there's input data, it's a contract interaction, could be a mint or other function call
      if (tx.input.startsWith('0xa9059cbb')) {
        return 'Transfer'; // Standard ERC-20 transfer
      } else if (tx.input.startsWith('0x40c10f19')) {
        return 'Mint'; // Standard mint function signature for ERC-20/721
      } else {
        return 'Mint'; // Fallback for other contract interactions
      }
    } else {
      return 'Transfer'; // If no input data, it's a regular transfer
    }
  };

  // Helper function to copy the value to the clipboard
  const copyToClipboard = (value, id) => {
    navigator.clipboard.writeText(value);
    setCopyStatus((prevStatus) => ({ ...prevStatus, [id]: true }));

    // Revert the "Copied" status after 7 seconds
    setTimeout(() => {
      setCopyStatus((prevStatus) => ({ ...prevStatus, [id]: false }));
    }, 7000);
  };

  if (isLoading) {
    return <div className="loading">Loading account details...</div>;
  }

  return (
    <div id="account-details-page">
      {/* Account Overview */}
      <div id="account-summary" className="info-card">
        <h2>Account Overview</h2>
        <div className="summary-details">
          <div>
            <p><strong>Account Address:</strong> {account}</p>
            <p><strong>ETH Balance:</strong> {balance} ETH</p>
          </div>
          <div>
            <p><strong>Total Transactions:</strong> {transactionCount}</p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div id="transaction-history" className="info-card">
        <h3>Transaction History</h3>
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Txn Hash</th>
              <th>Method</th>
              <th>Block</th>
              <th>Age</th>
              <th>From</th>
              <th>To</th>
              <th>Value</th>
              <th>Txn Fee</th>
            </tr>
          </thead>
          <tbody>
            {transactionHistory.map((tx, index) => (
              <tr key={index}>
                <td>
                  {tx.hash.slice(0, 10)}...
                  <span
                    className="copy-icon"
                    onClick={() => copyToClipboard(tx.hash, `hash-${index}`)}
                  >
                    {copyStatus[`hash-${index}`] ? <FaCheck /> : <FaCopy />}
                  </span>
                </td>
                <td>{getMethod(tx)}</td>
                <td>
                  {tx.blockNumber}
                  <span
                    className="copy-icon"
                    onClick={() => copyToClipboard(tx.blockNumber, `block-${index}`)}
                  >
                    {copyStatus[`block-${index}`] ? <FaCheck /> : <FaCopy />}
                  </span>
                </td>
                <td>{formatTimeAgo(tx.timeStamp)}</td>
                <td>
                  {tx.from.slice(0, 10)}...
                  <span
                    className="copy-icon"
                    onClick={() => copyToClipboard(tx.from, `from-${index}`)}
                  >
                    {copyStatus[`from-${index}`] ? <FaCheck /> : <FaCopy />}
                  </span>
                </td>
                <td>
                  {tx.to ? tx.to.slice(0, 10) + '...' : 'Contract Creation'}
                  <span
                    className="copy-icon"
                    onClick={() => copyToClipboard(tx.to || 'Contract Creation', `to-${index}`)}
                  >
                    {copyStatus[`to-${index}`] ? <FaCheck /> : <FaCopy />}
                  </span>
                </td>
                <td>
                  {ethers.utils.formatEther(tx.value)} ETH
                  <span
                    className="copy-icon"
                    onClick={() => copyToClipboard(ethers.utils.formatEther(tx.value), `value-${index}`)}
                  >
                    {copyStatus[`value-${index}`] ? <FaCheck /> : <FaCopy />}
                  </span>
                </td>
                <td>
                  {ethers.utils.formatEther(tx.gasUsed * tx.gasPrice)} ETH
                  <span
                    className="copy-icon"
                    onClick={() => copyToClipboard(ethers.utils.formatEther(tx.gasUsed * tx.gasPrice), `fee-${index}`)}
                  >
                    {copyStatus[`fee-${index}`] ? <FaCheck /> : <FaCopy />}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ERC-721 (NFT) Transfers */}
      <div id="nft-transfers" className="info-card">
        <h3>NFT Transfers</h3>
        <table className="transfer-table">
          <thead>
            <tr>
              <th>NFT</th>
              <th>From</th>
              <th>To</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {nftTransfers.map((transfer, index) => (
              <tr key={index}>
                <td>
                  {transfer.tokenName} #{transfer.tokenID}
                  <span
                    className="copy-icon"
                    onClick={() => copyToClipboard(transfer.tokenName, `nft-${index}`)}
                  >
                    {copyStatus[`nft-${index}`] ? <FaCheck /> : <FaCopy />}
                  </span>
                </td>
                <td>
                  {transfer.from.slice(0, 10)}...
                  <span
                    className="copy-icon"
                    onClick={() => copyToClipboard(transfer.from, `from-${index}`)}
                  >
                    {copyStatus[`from-${index}`] ? <FaCheck /> : <FaCopy />}
                  </span>
                </td>
                <td>
                  {transfer.to.slice(0, 10)}...
                  <span
                    className="copy-icon"
                    onClick={() => copyToClipboard(transfer.to, `to-${index}`)}
                  >
                    {copyStatus[`to-${index}`] ? <FaCheck /> : <FaCopy />}
                  </span>
                </td>
                <td>{formatTimeAgo(transfer.timeStamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp) {
  const secondsAgo = Math.floor(Date.now() / 1000 - timestamp);

  const daysAgo = Math.floor(secondsAgo / (3600 * 24));
  if (daysAgo > 0) {
    return `${daysAgo} days ago`;
  }

  const hoursAgo = Math.floor(secondsAgo / 3600);
  if (hoursAgo > 0) {
    return `${hoursAgo} hours ago`;
  }

  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo > 0) {
    return `${minutesAgo} minutes ago`;
  }

  return `${secondsAgo} seconds ago`;
}

export default AccountDetails;
