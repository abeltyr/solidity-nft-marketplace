// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./INftMarket.sol";

/// @title NFT Dutch Auction market
interface INftDutchAuctionMarket is INftMarket {
  struct Auction {
    /// @notice A unique id to identify the auction.
    uint256 id;
    /// @notice Address of the smart-contract of the nft to sell.
    address tokenAddress;
    /// @notice Id of the nft in the smart-contract.
    uint256 tokenId;
    /// @notice The nft seller.
    address seller;
    /// @notice Starting price for the nft.
    uint256 startingPrice;
    /// @notice Ending price for the nft.
    uint256 endingPrice;
    /// @notice Date to start selling.
    uint256 startDate;
    /// @notice Date to stop selling.
    uint256 endDate;
    /// @notice The interval at which the price should decrease.
    uint256 timeInterval;
    /// @notice Date at which the auction is closed.
    /// @dev Is null initially.
    uint256 closeDate;
    /// @notice The address of the buyer.
    /// @dev Is null initially.
    address buyer;
    /// @notice The price at which the nft is sold.
    /// @dev Is null initially.
    uint256 salePrice;
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

  /// @dev Emitted when an auction is closed by any mechanism.
  event Close(uint256 auctionId);

  /// @notice Creates a new auction.
  /// @dev Should fail if tokenAddress is not approved. Should fail if startDate is in the past. Should fail if endDate is older the startDate. Should fail if startingPrice is less then endPrice.
  function list(
    address tokenAddress,
    uint256 tokenId,
    uint256 startingPrice,
    uint256 endingPrice,
    uint256 startDate,
    uint256 endDate
  ) external;

  /// @notice Returns the current price for a particular auction.
  /// @param auctionId The id of the auction in question.
  function priceOf(uint256 auctionId) external view returns (uint256);

  /// @notice Close the auction and exchange nft for fund.
  /// @param auctionId The id of the auction in question.
  /// @dev Transfer the nft to the to msg.sender and transfer the msg.value to the seller. Should fail is msg.value is not equal to the nft price. Set closeDate, salePrice and buyer and emits Close.
  function buy(uint256 auctionId) external payable;
}
