// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/INftMarketEnglishAuction.sol";
import "./NftMarket.sol";

contract NftMarketEnglishAuction is INftMarketEnglishAuction, NftMarket {
  using Counters for Counters.Counter;
  Counters.Counter private _listingIdCounter;

  // auctionId -> Auction
  mapping(uint256 => Auction) public _auctions;

  // mapping for holding the amount information for the Bidders
  mapping(uint256 => mapping(address => uint256)) private bidders;

  /// set the close Date
  function _close(uint256 auctionId) internal {
    require(_auctions[auctionId].closeDate == 0, "auction already closed");

    // solhint-disable-next-line not-rely-on-time
    _auctions[auctionId].closeDate = block.timestamp;
  }

  // list item to offer on the NFTListingMarket
  function list(
    IERC721 provider,
    uint256 tokenId,
    uint256 startingPrice,
    uint256 startDate,
    uint256 endDate
  ) external override {
    // validate arguments
    uint256 _startDate = startDate;
    uint256 _endDate = endDate;
    if (_startDate == 0) {
      // solhint-disable-next-line not-rely-on-time
      _startDate = block.timestamp;
    } else {
      // solhint-disable-next-line not-rely-on-time
      require(_startDate > block.timestamp, "startDate cannot be in the past");
    }
    require(_endDate > _startDate, "invalid date range");
    // reserve nft
    _reserve(provider, tokenId, msg.sender);
    // create listing
    uint256 _listingId = _listingIdCounter.current();
    _listingIdCounter.increment();
    // construct listing item
    // In starting buyer address is null  and will update in buy function

    address _highestBidder = address(0);
    Auction memory _auction = Auction({
      id: _listingId,
      tokenId: tokenId,
      provider: provider,
      seller: payable(msg.sender),
      startingPrice: startingPrice,
      startDate: _startDate,
      endDate: _endDate,
      highestBidder: _highestBidder,
      closeDate: 0,
      highestBid: 0
    });
    _auctions[_listingId] = _auction;
    // emit list event
    emit List(
      _auction.id,
      _auction.provider,
      _auction.tokenId,
      _auction.seller,
      _auction.startDate,
      _auction.endDate,
      _auction.startingPrice
    );
  }

  //
  function bid(uint256 auctionId) external payable override {
    Auction memory _auction = _auctions[auctionId];

    require(_auction.seller != address(0), "Auction doesn't exist");

    // solhint-disable-next-line not-rely-on-time
    require(
      block.timestamp >= _auction.startDate,
      "Auction hasn't started yet"
    );

    require(_auction.closeDate == 0, "Auction is closed");

    require(msg.sender != _auction.seller, "Bidder is the auction seller");

    uint256 previousBid = bidders[auctionId][msg.sender];

    uint256 totalBid = previousBid + msg.value;

    if (_auction.highestBidder != address(0)) {
      uint256 highestBidAmount = bidders[auctionId][_auction.highestBidder];
      require(totalBid > highestBidAmount, "Bid is less then the highest bid");
    } else {
      // this will execute for the first bid
      require(
        totalBid > _auction.startingPrice,
        "Bid is less than the starting price"
      );
    }
    // update highest bidder address
    _auctions[auctionId].highestBidder = msg.sender;
    _auctions[auctionId].highestBid = totalBid;

    // update bidInfo
    bidders[auctionId][msg.sender] = totalBid;

    emit Bid(auctionId, msg.sender, totalBid);
  }

  function bidOf(uint256 auctionId, address bidder)
    external
    view
    override
    returns (uint256)
  {
    return bidders[auctionId][bidder];
  }

  function highestBidder(uint256 auctionId)
    external
    view
    override
    returns (address)
  {
    Auction memory _auction = _auctions[auctionId];
    return _auction.highestBidder;
  }

  function close(uint256 auctionId) external override {
    Auction memory _auction = _auctions[auctionId];

    require(
      msg.sender == _auction.seller || msg.sender == owner(),
      "Auction Seller or Market owner can only close"
    );

    // check the closed date has been set
    require(_auction.closeDate == 0, "Auction already closed");

    address releaseAddress = _auction.seller;

    if (_auction.highestBidder != address(0)) {
      releaseAddress = _auction.highestBidder;
    }

    _release(_auction.provider, _auction.tokenId, releaseAddress);

    _close(auctionId);
    emit Close(auctionId, _auction.highestBidder, _auction.highestBid);
  }

  function withdraw(uint256 auctionId) external override {
    Auction storage _auction = _auctions[auctionId];

    require(
      block.timestamp >= _auction.closeDate && _auction.closeDate != 0,
      "Auction is not closed"
    );

    require(
      msg.sender != _auction.highestBidder,
      "Highest bidder can not withdraw"
    );

    address fundAddress = address(0);

    if (msg.sender == _auction.seller) {
      fundAddress = _auction.highestBidder;
    } else {
      fundAddress = msg.sender;
    }

    uint256 bidAmount = bidders[auctionId][fundAddress];
    require(bidAmount > 0, "No Fund Found Under this Auction");
    bidders[auctionId][fundAddress] = 0;

    (bool success, ) = payable(msg.sender).call{value: bidAmount}("");
    require(success, "Fund transfer failed");
    emit Withdraw(auctionId, msg.sender);
  }
}
