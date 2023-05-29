// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Nft is ERC721, Ownable {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;
  string public baseURI;

  event BaseURIUpdated(string uri);

  constructor() ERC721("MeMusicNFT", "MNFT") {}

  function _baseURI() internal view override returns (string memory) {
    return baseURI;
  }

  function setBaseURI(string memory uri) public onlyOwner {
    baseURI = uri;
    emit BaseURIUpdated(uri);
  }

  // only owner can call mint function
  // to -> is the address to mint the nft to
  function mint(address to) public onlyOwner returns (uint256) {
    uint256 newItemId = _tokenIds.current();
    _safeMint(to, newItemId);
    _tokenIds.increment();
    return newItemId;
  }
}
