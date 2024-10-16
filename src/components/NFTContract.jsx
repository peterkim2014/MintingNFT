// NFTContract.js
import { ethers } from 'ethers';

const contractABI = [
  "function mint() public returns (uint256)"
];

const NFTContract = (provider, contractAddress) => {
  const signer = provider.getSigner();
  return new ethers.Contract(contractAddress, contractABI, signer);
};

export default NFTContract;