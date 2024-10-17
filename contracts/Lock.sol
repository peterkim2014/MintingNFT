// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MyNFT2 is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Mapping to track token IDs owned by each address
    mapping(address => uint256[]) private _ownedTokens;
    mapping(uint256 => uint256) private _ownedTokensIndex;

    constructor() ERC721("MyNFT2", "MNFT") {}

    // Mint function that accepts a tokenURI
    event NFTMinted(address indexed owner, uint256 tokenId, string tokenURI);

    function mint(address to, string memory tokenURI) public returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        _safeMint(to, newItemId);
        _setTokenURI(newItemId, tokenURI);

        // Update ownership tracking
        _addTokenToOwnerEnumeration(to, newItemId);

        emit NFTMinted(to, newItemId, tokenURI); // Emit event here

        return newItemId;
    }

    // Function to manually add the token to the owner's tracking
    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) internal {
        _ownedTokens[to].push(tokenId);
        _ownedTokensIndex[tokenId] = _ownedTokens[to].length - 1;
    }

    // Function to get a token ID owned by an address at a specific index (manual tokenOfOwnerByIndex)
    function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256) {
        require(index < _ownedTokens[owner].length, "Owner index out of bounds");
        return _ownedTokens[owner][index];
    }

    // Function to get the number of tokens owned by an address
    function tokensOwnedBy(address owner) public view returns (uint256) {
        return _ownedTokens[owner].length;
    }

    // Override _beforeTokenTransfer to remove from the previous owner and add to the new owner
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) 
        internal 
        override(ERC721)  // Only need to override ERC721
    {
        super._beforeTokenTransfer(from, to, tokenId);  // Correct number of arguments

        if (from != address(0) && from != to) {
            _removeTokenFromOwnerEnumeration(from, tokenId);
        }

        if (to != address(0) && to != from) {
            _addTokenToOwnerEnumeration(to, tokenId);
        }
    }

    // Internal function to remove a token from the previous owner's enumeration
    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) internal {
        uint256 lastTokenIndex = _ownedTokens[from].length - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];

        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];
            _ownedTokens[from][tokenIndex] = lastTokenId;  // Move the last token to the slot of the to-delete token
            _ownedTokensIndex[lastTokenId] = tokenIndex;  // Update the moved token's index
        }

        _ownedTokens[from].pop();  // Remove the last element
        delete _ownedTokensIndex[tokenId];
    }
}
