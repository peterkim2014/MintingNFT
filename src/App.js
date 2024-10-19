import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import axios from 'axios';
import WalletConnector from './components/WalletConnector';
import NFTMinter from './components/NFTMinter';
import NFTGallery from './components/NFTGallery';
import AccountDetails from './components/AccountDetails';
import Contract from './compiledData/contract2.json';
import MyCollections from './components/MyCollections';
import './App.css';



function App() {
  const [account, setAccount] = useState(null); // State to store the connected account
  const [provider, setProvider] = useState(null); // State to store the provider
  const [contract, setContract] = useState(null); // State to store the contract instance
  const [contractAddress, setContractAddress] = useState(""); // State to store the deployed contract address
  const [balance, setBalance] = useState(null); // State to store the account balance
  const [topPosition, setTopPosition] = useState(85); // State to store the scroll distance for account details
  const [leftPosition, setLeftPosition] = useState(10); // For dynamic left positioning
  const [isMinimized, setIsMinimized] = useState(false);
  const [isContractLoaded, setIsContractLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false); // For drag state
  const dragStartRef = useRef({ top: 0, left: 0 }); // Track the drag start positions
  const [logs, setLogs] = useState([]); // State to track logs from contract/account
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [latestBlock, setLatestBlock] = useState(null);
  const logsContainerRef = useRef(null);
  const [network, setNetwork] = useState('Sepolia');

  // Define network URLs
  const networkUrls = {
    Mainnet: 'https://api.etherscan.io/api',
    // Goerli: 'https://api-goerli.etherscan.io/api',
    Sepolia: 'https://api-sepolia.etherscan.io/api'
  };

  useEffect(() => {
    if (account) {
      // Function to fetch the latest block periodically
      const intervalBlock = setInterval(fetchLatestBlock, 2000); // Poll every 2 seconds
  
      // Clean up the interval on component unmount
      return () => clearInterval(intervalBlock);
    }
  }, [account, network, latestBlock]);
  
  // Keep the fetchLatestBlock function as is
  const fetchLatestBlock = async () => {
    try {
      const latestBlock = await provider.getBlockNumber();
      setLatestBlock(latestBlock);
    } catch (error) {
      console.error("Error fetching latest block:", error);
    }
  };


  useEffect(() => {
    if (!account) return;
  
    const fetchEventLogs = async () => {
      setIsLoadingLogs(true);
      try {
        if (!latestBlock) return;
  
        const ETHERSCAN_API_KEY = 'D54MR6FMGII7MHBY22VHI9GKQAIGI9EHB5';
        const fromBlock = latestBlock - 15; // Fetch logs from the last 15 blocks
        // console.log("Fetching logs from block: ", fromBlock, " to ", latestBlock);
  
        // Call the getLogs API to fetch event logs for the contract or account
        const response = await axios.get(
          `${networkUrls[network]}?module=logs&action=getLogs&address=${account}&fromBlock=${fromBlock}&toBlock=${latestBlock}&apikey=${ETHERSCAN_API_KEY}&offset=100`
        );
        // console.log("Event Logs: ", response.data.result)
  
        const newLogs = response.data.result || [];
        setLogs((prevLogs) => [...prevLogs, ...newLogs]); // Append new logs to the existing ones
      } catch (error) {
        console.error("Error fetching event logs:", error);
      } finally {
        setIsLoadingLogs(false);
      }
    };
  
    // Fetch logs every 2 seconds
    // const intervalBlock = setInterval(fetchLatestBlock, 2000);
    const intervalEvent = setInterval(fetchEventLogs, 2000);
  
    // Cleanup intervals on unmount
    return () => {
      // clearInterval(intervalBlock);
      clearInterval(intervalEvent);
    };
  }, [latestBlock, account, network]);

  useEffect(() => {
    if (provider && isContractLoaded === true) {
      const loadContract = async () => {
        try {
          const signer = provider.getSigner();

          // Make sure you're using correct ABI and bytecode
          const nftFactory = new ethers.ContractFactory(
            [
              "function mint(address to, string memory tokenURI) public returns (uint256)",
              "constructor() public"
            ], // Use correct ABI from compiled contract JSON
            Contract.Contract, // Use correct bytecode
            signer
          );

          // Estimate gas price and limit
          // const gasPrice = await provider.getGasPrice();
          // console.log("Gas Price:", ethers.utils.formatUnits(gasPrice, "gwei"), "gwei");

          // Deploy the contract with estimated gas
          const nftContract = await nftFactory.deploy();

          await nftContract.deployed();

          console.log("NFT Contract deployed at address:", nftContract.address);
          localStorage.setItem('contractAddress', nftContract.address);
          setContract(nftContract);
          setContractAddress(nftContract.address);
        } catch (error) {
          console.error("Error deploying/loading NFT Contract:", error);
        }
      };
      loadContract();
      handleCloseContract();
    }
  }, [isContractLoaded]);

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const balanceBigNumber = await provider.getBalance(account);
        const balanceInEth = ethers.utils.formatEther(balanceBigNumber);
        setBalance(balanceInEth);
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };
  
    // Fetch the balance on the initial load
    loadBalance();
  
    // Set up an interval to fetch the balance every 10 seconds (10000 ms)
    const intervalId = setInterval(loadBalance, 10000); 
  
    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [account]); 

  // Add scroll effect for account-info
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY; // Get vertical scroll position
      setTopPosition(85 + scrollY); // Adjust top position dynamically
    };

    window.addEventListener('scroll', handleScroll); // Attach scroll event listener

    return () => {
      window.removeEventListener('scroll', handleScroll); // Clean up event listener on unmount
    };
  }, []);

   // Function to start dragging
   const handleMouseDown = (e) => {
    e.preventDefault(); // Prevent text selection
    dragStartRef.current = {
      top: e.clientY - topPosition,
      left: e.clientX - leftPosition,
    };
    setIsDragging(true); // Start dragging
  };

  // Function to handle dragging/mouse movement
  const handleMouseMove = (e) => {
    if (!isDragging) return;

    // Update the container's position based on the mouse movement
    setTopPosition(e.clientY - dragStartRef.current.top);
    setLeftPosition(e.clientX - dragStartRef.current.left);
  };

  // Function to end dragging
  const handleMouseUp = () => {
    setIsDragging(false); // Stop dragging when the mouse is released
  };

  // Add event listeners for mousemove and mouseup during dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Toggle minimize and maximize the account-info
  const toggleMinimize = (e) => {
    if (isMinimized) {
      setTopPosition(85); 
      setLeftPosition(10);
    }
    setTopPosition(50); 
    setLeftPosition(10);
    setIsMinimized(!isMinimized);
  };

  // Function to handle manual contract load
  const handleLoadContract = () => {
    setIsContractLoaded(true); // Reset the contract loaded state to trigger loading
  };
  // Function to handle manual contract close
  const handleCloseContract = () => {
    setIsContractLoaded(false); // Reset the contract loaded state to trigger loading
  };

  // Dropdown component for network selection
  const handleNetworkChange = (event) => {
    setNetwork(event.target.value);
  };

  return (
    <Router>
      <div className="App">
        <div className="background-3d">
          <div className="bg-circle"></div>
          <div className="bg-circle"></div>
          <div className="bg-circle"></div>
        </div>
        
        <div className="logs-container" ref={logsContainerRef}>
          <div className="network-selector">
                <label htmlFor="network">Select Network: </label>
                <select id="network" value={network} onChange={handleNetworkChange}>
                  <option value="Mainnet">Mainnet</option>
                  {/* <option value="Goerli">Goerli</option> */}
                  <option value="Sepolia">Sepolia</option>
                </select>
            </div>
            <div className="logs-content">
              <p>Current Block: {latestBlock}</p>
                <div>
                  {logs.map((log, index) => (
                    <div key={index} className="logs-list">
                      <p>
                        <strong>Event:</strong> {log.topics[index]}
                      </p>
                      <p>
                        <strong>Data:</strong> {log.data}
                      </p>
                    </div>
                  ))}
                </div>
            </div>
        </div>

        <div className="header">
          <h1 className="animated-title">OMEGA</h1>
          {/* <h2 className="animated-title">Mint Your NFT (Test Network)</h2> */}
          <div className="nav-bar">
            <ul className="nav-links">
              <li className="nav-item">
                <Link to="/">Home</Link>
              </li>
              <li className="nav-item">
                <Link to="/mint">Mint</Link>
              </li>
              <li className="nav-item">
                <Link to="/account">Account</Link>
              </li>
              <li className="nav-item">
                <Link to="/mycollections">My Collections</Link>
              </li>
            </ul>
          </div>
        </div>
        <WalletConnector setAccount={setAccount} setProvider={setProvider} />

        <Routes>
          <Route
            path="/"
            element={
              <>
                
                <NFTGallery account={account} provider={provider} contractAddress={contractAddress} />
              </>
            }
          />

          <Route
            path="/mint"
            element={
              account && provider ? (
                <NFTMinter account={account} provider={provider} contract={contract} />
              ) : (
                <p>Please connect your wallet to access the Mint page.</p>
              )
            }
          />

          <Route 
            path="/account" 
            element={
              <>
                <AccountDetails balance={balance} account={account} provider={provider} network={network} latestBlock={latestBlock}/>
              </>
            } 
          />

          <Route 
            path="/mycollections" 
            element={
              <>
                <MyCollections account={account} contract={contract} provider={provider} latestBlock={latestBlock}/>
              </>
            } 
          /> 
        </Routes>

        {account && (
          <div
            className={`account-info ${isMinimized ? 'minimized' : ''}`}
            style={{ top: `${topPosition}px`, left: `${leftPosition}px` }}
            onMouseDown={handleMouseDown}
          >
            {!isMinimized && (
              <>
                <p>Your connected account: {account}</p>
                <p>Account Balance: {balance} ETH</p>
                <p>Contract Address: {contractAddress ? contractAddress : "Not deployed yet"}</p>
                <button onClick={handleLoadContract} className="load-contract-btn">
                  Load Contract
                </button>
              </>
            )}
            <button className="minimize-btn" onClick={toggleMinimize}>
              {isMinimized ? 'Expand' : 'Minimize'}
            </button>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;