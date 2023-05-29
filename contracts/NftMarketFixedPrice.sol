// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/INftMarketFixedPrice.sol";
import "./NftMarket.sol";

contract NftMarketFixedPrice is INftMarketFixedPrice, NftMarket {
  using Counters for Counters.Counter;

  Counters.Counter private _listingIdCounter;
  mapping(uint256 => Listing) public _listings;

  function _close(uint256 listingId) internal {
    // require(_listings[listingId].closeDate = 0, "listing already closed");
    _listings[listingId].closeDate = block.timestamp;
  }

  /// @notice Registers the nft and creates a new listing.
  /// @dev Should fail if startDate is in the past. Should fail if endDate is older the startDate.
  function list(
    IERC721 provider,
    uint256 tokenId,
    uint256 price,
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

    Listing memory _listing = Listing({
      id: _listingId,
      tokenId: tokenId,
      provider: provider,
      seller: payable(msg.sender),
      price: price,
      buyer: address(0),
      startDate: _startDate,
      endDate: _endDate,
      closeDate: 0
    });
    _listings[_listingId] = _listing;

    emit List(
      _listing.id,
      _listing.provider,
      _listing.tokenId,
      _listing.seller,
      _listing.price,
      _listing.startDate,
      _listing.endDate
    );
  }

  /// @notice Close the listing and exchange nft for fund.
  /// @param listingId The id of the listing in question.
  /// @dev Transfer the nft to the to msg.sender and transfer the msg.value to the seller. Should fail is msg.value is not equal to the nft price.
  function buy(uint256 listingId) external payable override {
    Listing memory _listing = _listings[listingId];
    require(msg.value == _listing.price, "insufficient fund");

    // update listing
    _listings[listingId].buyer = msg.sender;

    // release the nft
    _close(listingId);
    _release(
      _listings[listingId].provider,
      _listings[listingId].tokenId,
      msg.sender
    );

    // transfer money
    (bool success, ) = payable(_listing.seller).call{value: msg.value}("");
    require(success, "fund transfer failed");

    emit Close(listingId, msg.sender);
  }

  /// @notice Close a listing.
  /// @param listingId The id of the listing in question.
  function close(uint256 listingId) external override {
    _close(listingId);
    _release(
      _listings[listingId].provider,
      _listings[listingId].tokenId,
      _listings[listingId].seller
    );
    emit Close(listingId, address(0));
  }
}
