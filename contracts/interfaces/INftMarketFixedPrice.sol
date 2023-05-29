// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./INftMarket.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @title Listing market
interface INftMarketFixedPrice is INftMarket {
  struct Listing {
    /// @notice A unique id to identify the auction.
    uint256 id;
    /// @notice The smart-contract of the nft to sell.
    IERC721 provider;
    /// @notice Id of the nft in the smart-contract.
    uint256 tokenId;
    /// @notice The nft seller.
    address payable seller;
    /// @notice price of the nft.
    uint256 price;
    /// @notice The address of the buyer.
    /// @dev Is null initially.
    address buyer;
    /// @notice Date to start receiving bids.
    uint256 startDate;
    /// @notice Date to stop receiving bids.
    uint256 endDate;
    /// @notice Date at which the listing is closed.
    /// @dev Is null initially.
    uint256 closeDate;
  }

  /// @dev Emitted on new listing.
  event List(
    uint256 listingId,
    IERC721 provider,
    uint256 tokenId,
    address seller,
    uint256 price,
    uint256 startDate,
    uint256 endDate
  );

  /// @dev Emitted when a listing is bought.
  event Close(uint256 listingId, address buyer);

  /// @notice Registers the nft and creates a new listing.
  /// @dev Should fail if startDate is in the past. Should fail if endDate is older the startDate.
  function list(
    IERC721 provider,
    uint256 tokenId,
    uint256 price,
    uint256 startDate,
    uint256 endDate
  ) external;

  /// @notice Close the listing and exchange nft for fund.
  /// @param listingId The id of the listing in question.
  /// @dev Transfer the nft to the to msg.sender and transfer the msg.value to the seller. Should fail is msg.value is not equal to the nft price. Set closeDate and buyer and emits Close.
  function buy(uint256 listingId) external payable;

  /// @notice Close a listing.
  /// @param listingId The id of the listing in question.
  function close(uint256 listingId) external;
}
