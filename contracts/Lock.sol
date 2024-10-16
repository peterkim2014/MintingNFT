// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";

contract MyNFT is ERC721 {
    uint256 public tokenCounter;

    constructor() ERC721("MyNFT", "MNFT") {
        tokenCounter = 0;
    }

    function mint() public returns (uint256) {
        console.log("Minting started for address:", msg.sender);
        uint256 newItemId = tokenCounter;
        _safeMint(msg.sender, newItemId);
        console.log("Minted token ID:", newItemId);
        tokenCounter++;
        return newItemId;
    }
}
