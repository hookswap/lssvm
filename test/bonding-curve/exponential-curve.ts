import { expect } from "chai";
import { ethers } from "hardhat";
import { utils, BigNumber } from 'ethers';
import { ExponentialCurve } from '../../typechain-types/contracts/bonding-curves/ExponentialCurve';

describe('ExponentialCurve', function () {

  let curve: ExponentialCurve;

  before(async function () {
    const ExponentialCurve = await ethers.getContractFactory('ExponentialCurve');
    curve = await ExponentialCurve.deploy();
  });

  it('getBuyInfoExample', async function () {
    const spotPrice: BigNumber = utils.parseEther('3');
    const delta: BigNumber = utils.parseEther('2');
    const numItems: BigNumber = BigNumber.from('5');
    const feeMultiplier: BigNumber = utils.parseEther('0.005'); // 0.5%
    const protocolFeeMultiplier: BigNumber = utils.parseEther('0.003'); // 0.3%
    const quote = await curve.getBuyInfo(spotPrice, delta, numItems, feeMultiplier, protocolFeeMultiplier);
    expect(quote.error).to.eq(0, 'Error code not OK');
    expect(quote.newSpotPrice).to.eq(utils.parseEther('96'), 'Error code not OK');
    expect(quote.newDelta).to.eq(utils.parseEther('2'), 'Delta incorrect');
    expect(quote.inputValue).to.eq(utils.parseEther('187.488'), 'Input value incorrect');
    expect(quote.protocolFee).to.eq(utils.parseEther('0.558'), 'Protocol fee incorrect');
  });

  it('getBuyInfoWithoutFee', async function () {
    const spotPrice: BigNumber = utils.parseEther('3');
    const delta: BigNumber = utils.parseEther('2');
    const numItems: BigNumber = BigNumber.from('5');
    const quote = await curve.getBuyInfo(spotPrice, delta, numItems, BigNumber.from(0), BigNumber.from(0));
    expect(quote.error).to.equal(0, 'Error code not OK');
    expect((quote.newSpotPrice.gt(spotPrice) && delta.gt(1)) || (quote.newSpotPrice.eq(spotPrice) && delta.eq(1))).to.eq(true, 'Price update incorrect');
    expect(quote.inputValue).to.gte(numItems.mul(spotPrice), 'Input value incorrect');
  });

  it('getSellInfoExample', async function () {
    const spotPrice: BigNumber = utils.parseEther('3');
    const delta: BigNumber = utils.parseEther('2');
    const numItems: BigNumber = BigNumber.from('5');
    const feeMultiplier: BigNumber = utils.parseEther('0.005'); // 0.5%
    const protocolFeeMultiplier: BigNumber = utils.parseEther('0.003'); // 0.3%
    const quote = await curve.getSellInfo(spotPrice, delta, numItems, feeMultiplier, protocolFeeMultiplier);
    expect(quote.error).to.eq(0, 'Error code not OK');
    expect(quote.newSpotPrice).to.eq(utils.parseEther('0.09375'), 'Error code not OK');
    expect(quote.newDelta).to.eq(utils.parseEther('2'), 'Delta incorrect');
    expect(quote.outputValue).to.eq(utils.parseEther('5.766'), 'Input value incorrect');
    expect(quote.protocolFee).to.eq(utils.parseEther('0.0174375'), 'Protocol fee incorrect');
  });

  it('getSellInfoWithoutFee', async function () {
    const spotPrice: BigNumber = utils.parseEther('3');
    const delta: BigNumber = utils.parseEther('2');
    const numItems: BigNumber = BigNumber.from('5');
    const quote = await curve.getSellInfo(spotPrice, delta, numItems, BigNumber.from(0), BigNumber.from(0));
    expect(quote.error).to.equal(0, 'Error code not OK');
    expect((quote.newSpotPrice.lt(spotPrice) && delta.gt(0)) || (quote.newSpotPrice.eq(spotPrice) && delta.eq(0))).to.eq(true, 'Price update incorrect');
    expect(quote.outputValue).to.lte(numItems.mul(spotPrice), 'Input value incorrect');
  });
});