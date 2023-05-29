// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/INftMarket.sol";

/// @title NFT market
abstract contract NftMarket is INftMarket, Ownable {
  mapping(IERC721 => bool) private _approvedProviders;

  event ApproveProvider(IERC721 providerAddress, bool approved);

  modifier approvedProviderOnly(IERC721 provider) {
    require(_approvedProviders[provider], "only approved provider");
    _;
  }

  /// @notice Set an nft address as approved or not.
  function approveProvider(IERC721 nft, bool approved)
    external
    override
    onlyOwner
  {
    _approvedProviders[nft] = approved;
    emit ApproveProvider(nft, approved);
  }

  /// @notice Returns whether an nft address is approved.
  function isProviderApproved(IERC721 nft)
    external
    view
    override
    returns (bool)
  {
    return _approvedProviders[nft];
  }

  /// @notice Reserve an NFT for sale.
  function _reserve(
    IERC721 provider,
    uint256 tokenId,
    address from
  ) internal approvedProviderOnly(provider) {
    address tokenOwner = provider.ownerOf(tokenId);
    if (tokenOwner != address(this)) {
      require(tokenOwner == from, "not owner");
      provider.transferFrom(tokenOwner, address(this), tokenId);
    }
  }

  /// @notice Release an NFT to a new owner.
  function _release(
    IERC721 provider,
    uint256 tokenId,
    address to
  ) internal approvedProviderOnly(provider) {
    provider.safeTransferFrom(address(this), to, tokenId);
  }
}
