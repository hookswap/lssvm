import { BigNumber } from 'ethers';

export interface PairSwapAny {
    pair: string,
    numItems: BigNumber
}

export interface PairSwapSpecific {
    pair: string,
    nftIds: BigNumber[]
}

export interface RobustPairSwapAny {
    swapInfo: PairSwapAny,
    maxCost: BigNumber
}

export interface RobustPairSwapSpecific {
    swapInfo: PairSwapSpecific,
    maxCost: BigNumber
}

export interface RobustPairSwapSpecificForToken {
    swapInfo: PairSwapSpecific,
    minOutput: BigNumber
}

export interface NFTsForAnyNFTsTrade {
    nftToTokenTrades: PairSwapSpecific[],
    tokenToNFTTrades: PairSwapAny[]
}

export interface NFTsForSpecificNFTsTrade {
    nftToTokenTrades: PairSwapSpecific[],
    tokenToNFTTrades: PairSwapSpecific[]
}

export interface RobustPairNFTsFoTokenAndTokenforNFTsTrade {
    tokenToNFTTrades: PairSwapSpecific[]
    nftToTokenTrades: RobustPairSwapSpecificForToken[],
    inputAmount: BigNumber,
    tokenRecipient: string,
    nftRecipient: string
}

export enum PoolType {
    TOKEN,
    NFT,
    TRADE
}

export enum PairVariant {
    ENUMERABLE_ETH,
    MISSING_ENUMERABLE_ETH,
    ENUMERABLE_ERC20,
    MISSING_ENUMERABLE_ERC20
}