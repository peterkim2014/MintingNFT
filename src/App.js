import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import WalletConnector from './components/WalletConnector';
import NFTMinter from './components/NFTMinter';
import NFTGallery from './components/NFTGallery';
// import Contract from './compiledData/contract.json';
import Contract from './compiledData/contract2.json';
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
  }, [account, provider]); 

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




  return (
    <div className="App">
      <div className="background-3d">
        <div className="bg-circle"></div>
        <div className="bg-circle"></div>
        <div className="bg-circle"></div>
      </div>
      
      <div className='header'>
        <h1 className="animated-title">Mint Your NFT (Test Network)</h1>
        <div className='nav-bar'>
            <ul className='nav-links'>
                <li className='nav-item home active'>Home</li>
                <li className='nav-item'>About</li>
                <li className='nav-item'>Collections</li>
                <li className='nav-item'>Contact</li>
            </ul>
        </div>
      </div>


      <WalletConnector setAccount={setAccount} setProvider={setProvider}/>

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

      
      {account && provider && contract && <NFTMinter account={account} provider={provider} contract={contract} />}
      <NFTGallery account={account} provider={provider} contractAddress={contractAddress} />
    </div>
  );
}

export default App;