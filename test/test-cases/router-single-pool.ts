import 'dotenv/config';
import { BigNumber, utils, Overrides, PayableOverrides, ContractTransaction, ContractReceipt } from 'ethers';
import { ethers } from "hardhat";
import { LinearCurve } from '../../typechain-types/contracts/bonding-curves/LinearCurve';
import { LSSVMPairFactory } from '../../typechain-types/contracts/LSSVMPairFactory';
import { LSSVMRouter } from '../../typechain-types/contracts/LSSVMRouter';
import { LSSVMPair } from '../../typechain-types/contracts/LSSVMPair';
import { PairVariant, PoolType } from './types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Test721Enumerable } from '../../typechain-types/contracts/mocks/Test721Enumerable';
import { ExponentialCurve } from '../../typechain-types/contracts/bonding-curves/ExponentialCurve';

describe('RouterSinglePool', function () {

  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addrs: SignerWithAddress[];

  let factory: LSSVMPairFactory;
  let router: LSSVMRouter;
  const protocolFeeMultiplier: BigNumber = utils.parseEther('0.003'); // 0.3%
  const numInitialNFTs: number = 10;

  before(async function () {
    [owner, addr1, ...addrs] = await ethers.getSigners();
    // Deploy pair templates
    const LSSVMPairEnumerableETH = await ethers.getContractFactory('LSSVMPairEnumerableETH');
    const lssvmPairEnumerableETH = await LSSVMPairEnumerableETH.deploy();
    const LSSVMPairMissingEnumerableETH = await ethers.getContractFactory('LSSVMPairMissingEnumerableETH');
    const lssvmPairMissingEnumerableETH = await LSSVMPairMissingEnumerableETH.deploy();
    const LSSVMPairEnumerableERC20 = await ethers.getContractFactory('LSSVMPairEnumerableERC20');
    const lssvmPairEnumerableERC20 = await LSSVMPairEnumerableERC20.deploy();
    const LSSVMPairMissingEnumerableERC20 = await ethers.getContractFactory('LSSVMPairMissingEnumerableERC20');
    const lssvmPairMissingEnumerableERC20 = await LSSVMPairMissingEnumerableERC20.deploy();
    // Deploy factory
    const LSSVMPairFactory = await ethers.getContractFactory('LSSVMPairFactory');
    factory = await LSSVMPairFactory.deploy(
      lssvmPairEnumerableETH.address,
      lssvmPairMissingEnumerableETH.address,
      lssvmPairEnumerableERC20.address,
      lssvmPairMissingEnumerableERC20.address,
      owner.address,
      protocolFeeMultiplier
    );
    // Deploy router
    const LSSVMRouter = await ethers.getContractFactory('LSSVMRouter');
    router = await LSSVMRouter.deploy(factory.address);
    await factory.setRouterAllowed(router.address, true);
  });

  async function swapTokenForSingleAnyNFT(pair: LSSVMPair) {
    const swapList: LSSVMRouter.PairSwapAnyStruct[] = [{
      pair: pair.address,
      numItems: BigNumber.from(1)
    }];
    const quote = await pair.getBuyNFTQuote(BigNumber.from(1));
    const deadline: BigNumber = BigNumber.from(Math.floor(new Date().getTime() / 1000) + 3600);
    const overrides: PayableOverrides = { value: quote.inputAmount };
    const pairVariant: PairVariant = await pair.pairVariant();
    if (PairVariant.ENUMERABLE_ETH === pairVariant || PairVariant.MISSING_ENUMERABLE_ETH) {
      await router.swapETHForAnyNFTs(swapList, owner.address, owner.address, deadline, overrides);
    } else {
      await router.swapERC20ForAnyNFTs(swapList, owner.address, owner.address, deadline, overrides);
    }
  };

  describe('LinearCurve', function () {

    let bondingCurve: LinearCurve;

    before(async function () {
      // Deploy bonding curve
      const LinearCurve = await ethers.getContractFactory('LinearCurve');
      bondingCurve = await LinearCurve.deploy();
      await factory.setBondingCurveAllowed(bondingCurve.address, true);
    });

    describe('EnumerableETH', function () {

      let test721: Test721Enumerable;
      let pair: LSSVMPair;

      before(async function () {
        // Deploy NFT
        const Test721Enumerable = await ethers.getContractFactory('Test721Enumerable');
        test721 = await Test721Enumerable.deploy();
        // set NFT approvals
        await test721.setApprovalForAll(factory.address, true);
        await test721.setApprovalForAll(router.address, true);
        // Setup pair parameters
        const delta: BigNumber = BigNumber.from(0);
        const spotPrice: BigNumber = utils.parseEther('1');
        const idList: BigNumber[] = [];
        for (let i: number = 1; i <= numInitialNFTs; i++) {
          await test721.mint(owner.address, i);
          idList.push(BigNumber.from(i));
        }
        // Create a pair with a spot price of 1 eth, 10 NFTs, and no price increases
        const overrides: PayableOverrides = { value: utils.parseEther('10') };
        const transaction: ContractTransaction = await factory.createPairETH(
          test721.address,
          bondingCurve.address,
          '0x0000000000000000000000000000000000000000',
          PoolType.TRADE,
          delta,
          0,
          spotPrice,
          idList,
          overrides
        );
        const receipt: ContractReceipt = await transaction.wait();
        const eventList: any = receipt.events?.filter(item => {
          return item.event === 'NewPair';
        });
        pair = await ethers.getContractAt('LSSVMPair', eventList[0].args[0]);
        // mint extra NFTs to this contract (i.e. to be held by the caller)
        for (let i: number = numInitialNFTs + 1; i <= 2 * numInitialNFTs; i++) {
          await test721.mint(owner.address, i);
        }
      });

      it('swapTokenForSingleAnyNFT', async function () {
        await swapTokenForSingleAnyNFT(pair);
      });
    });
  });

  describe('ExponentialCurve', function () {

    let bondingCurve: ExponentialCurve;

    before(async function () {
      // Deploy bonding curve
      const ExponentialCurve = await ethers.getContractFactory('ExponentialCurve');
      bondingCurve = await ExponentialCurve.deploy();
      await factory.setBondingCurveAllowed(bondingCurve.address, true);
    });

    describe('EnumerableETH', function () {

      let test721: Test721Enumerable;
      let pair: LSSVMPair;

      before(async function () {
        // Deploy NFT
        const Test721Enumerable = await ethers.getContractFactory('Test721Enumerable');
        test721 = await Test721Enumerable.deploy();
        // set NFT approvals
        await test721.setApprovalForAll(factory.address, true);
        await test721.setApprovalForAll(router.address, true);
        // Setup pair parameters
        const delta: BigNumber = utils.parseEther('1.01');
        const spotPrice: BigNumber = utils.parseEther('1');
        const idList: BigNumber[] = [];
        for (let i: number = 1; i <= numInitialNFTs; i++) {
          await test721.mint(owner.address, i);
          idList.push(BigNumber.from(i));
        }
        // Create a pair with a spot price of 1 eth, 10 NFTs, and no price increases
        const overrides: PayableOverrides = { value: utils.parseEther('10') };
        const transaction: ContractTransaction = await factory.createPairETH(
          test721.address,
          bondingCurve.address,
          '0x0000000000000000000000000000000000000000',
          PoolType.TRADE,
          delta,
          0,
          spotPrice,
          idList,
          overrides
        );
        const receipt: ContractReceipt = await transaction.wait();
        const eventList: any = receipt.events?.filter(item => {
          return item.event === 'NewPair';
        });
        pair = await ethers.getContractAt('LSSVMPair', eventList[0].args[0]);
        // mint extra NFTs to this contract (i.e. to be held by the caller)
        for (let i: number = numInitialNFTs + 1; i <= 2 * numInitialNFTs; i++) {
          await test721.mint(owner.address, i);
        }
      });

      it('swapTokenForSingleAnyNFT', async function () {
        await swapTokenForSingleAnyNFT(pair);
      });
    });
  });
});