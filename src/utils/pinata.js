import axios from 'axios';


export const pinJSONToIPFS = async(metadata) => {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    //making axios POST request to Pinata ⬇️
    return axios
        .post(url, metadata, {
            headers: {
                pinata_api_key: "f75ca3f475cde44d3716",
                pinata_secret_api_key: "b4e510c005f231de7b91b7e4c335acf0695613e1a06bcfe5989e444a9cede57d",
            }
        })
        .then(function (response) {
           return {
               success: true,
               pinataUrl: "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash
           };
        })
        .catch(function (error) {
            console.log(error)
            return {
                success: false,
                message: error.message,
            }

    });
};