// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./INftMarket.sol";

/// @title NFT Fixed Fractional Ownership Market
interface INftFixedFractionalOwnershipMarket is INftMarket {
  struct Listing {
    /// @notice A unique id to identify the listing.
    uint256 id;
    /// @notice Address of the smart-contract of the nft to sell.
    address tokenAddress;
    /// @notice Id of the nft in the smart-contract.
    uint256 tokenId;
    /// @notice The nft seller.
    address seller;
    /// @notice Price of a single share.
    uint256 sharePrice;
    /// @notice Total number of share.
    uint256 totalSupply;
    /// @notice Date to start receiving bids.
    uint256 startDate;
    /// @notice Date to stop receiving bids.
    uint256 endDate;
    /// @notice Date at which the auction is closed.
    /// @dev Is null initially.
    uint256 closeDate;
  }

  /// @dev Emitted when a new auction is listed.
  event List(
    uint256 auctionId,
    uint256 tokenId,
    address tokenAddress,
    address seller,
    uint256 startDate,
    uint256 endDate,
    uint256 startingPrice
  );

  /// @dev Emitted when a bid is placed.
  event Buy(uint256 auctionId, address bidder, uint256 bid);

  /// @dev Emitted when an auction is closed by any mechanism.
  event Close(uint256 auctionId);

  /// @dev Emitted when a bidder withdraw his fund.
  event Withdraw(uint256 auctionId, address withdrawer);

  /// @notice Creates a new listing.
  /// @dev Should fail if tokenAddress is not approved. Should fail if startDate is in the past. Should fail if endDate is older the startDate.
  function list(
    address tokenAddress,
    uint256 tokenId,
    uint256 sharePrice,
    uint256 totalSupply,
    uint256 startDate,
    uint256 endDate
  ) external;

  /// @notice Returns the share price of a listing.
  /// @param listingId The id of the listing in question.
  function priceOf(uint256 listingId) external view returns (uint256);

  /// @notice Returns the total supply of a listing.
  /// @param listingId The id of the listing in question.
  function supplyOf(uint256 listingId) external view returns (uint256);

  /// @notice Returns the number of shares available for sale.
  /// @param listingId The id of the auction in question.
  function availableShares(uint256 listingId) external view returns (uint256);

  /// @notice Returns the number of shares owned by a shareHolder.
  /// @param listingId The id of the auction in question.
  /// @param shareHolder The shareHolder's address.
  function sharesOf(uint256 listingId, address shareHolder)
    external
    view
    returns (uint256);

  /// @notice Purshase an quantity of shares.
  /// @param listingId The id of the listing in question.
  /// @dev Should fail if the listing hasn't started yet, or has already ended. Should fail if msg.value is not equal to sharePrice * quatity.
  function buy(uint256 listingId, uint256 quantity) external payable;

  /// @notice Withdraw the fund deposited in a listing.
  /// @param listingId The id of the listing in question.
  /// @dev Should only be possible if the listing was closed and all the shares weren't sold.
  function withdraw(uint256 listingId) external;

  /// @notice Close the listing.
  /// @param listingId The id of the listing in question.
  function close(uint256 listingId) external;
}
