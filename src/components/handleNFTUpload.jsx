import axios from 'axios';

export const handleImageUpload = async (file) => {
    if (!file) {
        return { success: false, message: "No file provided" };
    }

    // Use Pinata to pin the file to IPFS
    const formData = new FormData();
    formData.append('file', file);

    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    try {
        const response = await axios.post(url, formData, {
            maxContentLength: "Infinity", // Required for large files
            headers: {
                'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                pinata_api_key: "f75ca3f475cde44d3716",
                pinata_secret_api_key: "b4e510c005f231de7b91b7e4c335acf0695613e1a06bcfe5989e444a9cede57d",
            }
        });

        if (response.data && response.data.IpfsHash) {
            const ipfsLink = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
            console.log('Image uploaded to IPFS:', ipfsLink);
            return { success: true, ipfsLink: ipfsLink };
        } else {
            return { success: false, message: "Failed to get IPFS link" };
        }
    } catch (error) {
        console.error("Error uploading image to IPFS:", error);
        return { success: false, message: error.message };
    }
};
