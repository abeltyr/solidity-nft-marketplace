// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @title NFT Store
interface INftStore {
  /// @notice Set an nft address as approved or not.
  function approveProvider(address nftAddress, bool approved) external;

  /// @notice Returns whether an nft address is approved.
  function isProviderApproved(IERC721 nftAddress) external view returns (bool);

  /// @notice Set an manager as approved or not.
  function approveMarket(address manager, bool approved) external;

  /// @notice Returns whether an manager is approved.
  function isMarketApproved(address manager) external view returns (bool);

  /// @notice Reserve a token for listing.
  /// @dev Fails unless the caller is an approved market and the nftAddress is an approved provider.
  function reserve(
    IERC721 tokenAddress,
    uint256 tokenId,
    address from
  ) external;

  /// @notice Release a token to a new owner.
  function release(
    IERC721 tokenAddress,
    uint256 tokenId,
    address to
  ) external;

  /// @notice Add a listing to a token.
  function list(
    IERC721 tokenAddress,
    uint256 tokenId,
    uint256 listingId
  ) external;

  /// @notice Remove a listing from a token.
  function unlist(
    IERC721 tokenAddress,
    uint256 tokenId,
    uint256 listingId
  ) external;

  /// @notice Remove all listing from a  token.
  function clear(IERC721 tokenAddress, uint256 tokenId) external;
}
