# hookAMM

An implementation of the AMM protocol described [here](https://blog.0xmons.xyz/83017366310).

Liquidity providers use `LSSVMPairFactory` to deploy a modified minimal proxy `LSSVMPair` for a specific NFT collection. From there, the deployed pool maintains its own TOKEN/NFT inventory. Users can then call the various `swap` functions on the pool to trade TOKEN/NFTs.

`LSSVMPair`s are either `LSSVMPairEnumerable` or `LSSVMPairMissingEnumerable` depending on whether or not the pair's `ERC721` contract supports `Enumerable` or not. If it doesn't, we implement our own ID set to allow for easy access to NFT IDs in the pool.

For the actual token, NFTs are paired either with an `ERC20` or `ETH`, so there are 4 types of pairs:

* Missing Enumerable | ETH
* Missing Enumerable | ERC20
* Enumerable | ETH
* Enumerable | ERC20

The `LSSVMRouter` allows splitting swaps across multiple `LSSVMPair`s to purchase and sell multiple NFTs in one call.

An `LSSVMPair` can be TOKEN, NFT, or TRADE. 
The type refers to what the pool holds:
- a TOKEN pool has tokens that it is willing to give to traders in exchange for NFTs
- an NFT pool has NFTs that it is willing to give to traders in exchange for tokens
- a TRADE pools allow for both TOKEN-->NFT and NFT-->TOKEN swaps.

The `LSSVMPair` `swap` functions are named from the perspective of the end user. EX: `swapTokenForAnyNFTs` means the caller is sending ETH and receiving NFTs.

In order to determine how many NFTs or tokens to give or receive, each `LSSVMPair` calls a discrete bonding curve contract that conforms to the `ICurve` interface. Bonding curve contracts are intended to be pure; it is the responsibility of `LSSVMPair` to update its state and perform input/output validation.

See inline comments for more on swap/bonding curve logic. 

### Architecture

See the diagram below for a high-level overview, credits go to [IT DAO](https://twitter.com/InfoTokenDAO):

![overview of lssvm architecture](./sudo-diagram.png)

### Testing

To do something...

# Built with HardHat

To do something...