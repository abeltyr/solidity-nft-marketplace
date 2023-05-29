// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./INftMarket.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @title NFT English Auction market
interface INftMarketEnglishAuction is INftMarket {
  struct Auction {
    /// @notice A unique id to identify the auction.
    uint256 id;
    /// @notice Address of the smart-contract of the nft to sell.
    IERC721 provider;
    /// @notice Id of the nft in the smart-contract.
    uint256 tokenId;
    /// @notice The nft seller.
    address payable seller;
    /// @notice Minimal price at which bids should start.
    uint256 startingPrice;
    /// @notice Date to start receiving bids.
    uint256 startDate;
    /// @notice Date to stop receiving bids.
    uint256 endDate;
    /// @notice Date at which the auction is closed.
    /// @dev Is null initially.
    uint256 closeDate;
    /// @notice The address with the highest bid at any given time.
    /// @dev Is null initially.
    address highestBidder;
    /// @notice The bid amount from the highestBidder.
    /// @dev Is null initially.
    uint256 highestBid;
  }

  /// @dev Emitted when a new auction is listed.
  event List(
    uint256 auctionId,
    IERC721 provider,
    uint256 tokenId,
    address seller,
    uint256 startDate,
    uint256 endDate,
    uint256 startingPrice
  );

  /// @dev Emitted when a bid is placed.
  event Bid(uint256 auctionId, address bidder, uint256 bid);

  /// @dev Emitted when an auction is closed by any mechanism.
  event Close(uint256 auctionId, address buyer, uint256 highestBid);

  /// @dev Emitted when a bidder withdraw his fund.
  event Withdraw(uint256 auctionId, address withdrawer);

  /// @notice Creates a new auction.
  /// @dev Should fail if tokenAddress is not approved. Should fail if startDate is in the past. Should fail if endDate is older the startDate.
  function list(
    IERC721 provider,
    uint256 tokenId,
    uint256 startingPrice,
    uint256 startDate,
    uint256 endDate
  ) external;

  /// @notice Returns the total amount bided by a bidder for a particular auction.
  /// @param auctionId The id of the auction in question.
  /// @param bidder The bidder's address.
  function bidOf(uint256 auctionId, address bidder)
    external
    view
    returns (uint256);

  /// @notice Returns the address with the highest bid for a particular auction.
  /// @param auctionId The id of the auction in question.
  function highestBidder(uint256 auctionId) external view returns (address);

  /// @notice Bid a particular auction.
  /// @param auctionId The id of the auction in question.
  /// @dev Should fail if the auction hasn't started yet, or has already ended. Should fail if the bidder is the auction seller. should fail if the bid is less than the starting price. Should fail if the bid is less then the highest bid. If the bid succeed it becomes the bidder becomes the highestBidder.
  function bid(uint256 auctionId) external payable;

  /// @notice Withdraw the fund deposited in an auction.
  /// @param auctionId The id of the auction in question.
  /// @dev Should fail if the auction is not closed.
  function withdraw(uint256 auctionId) external;

  /// @notice Close the auction.
  /// @param auctionId The id of the auction in question.
  /// @dev If the auction has not ended, set closeDate only. If the auction has ended and the highest bidder is null set closeDate and transfer the nft back to the seller. If the auction has ended and the highest bidder is not null, transfer the nft to the highest bidder and transfer the highestBidder's fund to the seller.
  function close(uint256 auctionId) external;
}
