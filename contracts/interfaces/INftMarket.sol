// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @title NFT market
interface INftMarket {
  /// @notice Set an nft address as approved or not.
  function approveProvider(IERC721 nft, bool approved) external;

  /// @notice Returns whether an nft address is approved.
  function isProviderApproved(IERC721 nft) external view returns (bool);
}
