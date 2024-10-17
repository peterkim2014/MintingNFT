import React, { useEffect } from 'react';
import axios from 'axios';

const ContractSubmission = ({ setContractAddress }) => {
  useEffect(() => {
    const deployContract = async () => {
      try {
        console.log("Requesting contract deployment...");
        
        // Make a request to the backend to deploy the contract
        const response = await axios.get("http://localhost:5000/deploy");

        if (response.data.address) {
          console.log("Contract deployed successfully:", response.data.address);
          setContractAddress(response.data.address);
        } else {
          console.error("Failed to deploy contract. No address returned.");
        }
      } catch (error) {
        console.error("Error calling backend to deploy contract:", error);
      }
    };

    deployContract();
  }, [setContractAddress]);

  return null;
};

export default ContractSubmission;
