import { expect } from "chai";
import { ethers } from "hardhat";
import { utils, BigNumber } from 'ethers';
import { LinearCurve } from '../../typechain-types/contracts/bonding-curves/LinearCurve';

describe('LinearCurve', function () {

  let curve: LinearCurve;

  before(async function () {
    const LinearCurve = await ethers.getContractFactory('LinearCurve');
    curve = await LinearCurve.deploy();
    await curve.deployed();
  });

  it('getBuyInfoExample', async function () {
    const spotPrice: BigNumber = utils.parseEther('3');
    const delta: BigNumber = utils.parseEther('0.1');
    const numItems: BigNumber = BigNumber.from('5');
    const feeMultiplier: BigNumber = utils.parseEther('0.005'); // 0.5%
    const protocolFeeMultiplier: BigNumber = utils.parseEther('0.003'); // 0.3%
    const quote = await curve.getBuyInfo(spotPrice, delta, numItems, feeMultiplier, protocolFeeMultiplier);
    expect(quote.error).to.eq(0, 'Error code not OK');
    expect(quote.newSpotPrice).to.eq(utils.parseEther('3.5'), 'Error code not OK');
    expect(quote.newDelta).to.eq(utils.parseEther('0.1'), 'Delta incorrect');
    expect(quote.inputValue).to.eq(utils.parseEther('16.632'), 'Input value incorrect');
    expect(quote.protocolFee).to.eq(utils.parseEther('0.0495'), 'Protocol fee incorrect');
  });

  it('getBuyInfoWithoutFee', async function () {
    const spotPrice: BigNumber = utils.parseEther('3');
    const delta: BigNumber = utils.parseEther('0.1');
    const numItems: BigNumber = BigNumber.from('5');
    const quote = await curve.getBuyInfo(spotPrice, delta, numItems, BigNumber.from(0), BigNumber.from(0));
    expect(quote.error).to.equal(0, 'Error code not OK');
    expect((quote.newSpotPrice.gt(spotPrice) && delta.gt(0)) || (quote.newSpotPrice.eq(spotPrice) && delta.eq(0))).to.eq(true, 'Price update incorrect');
    expect(quote.inputValue).to.gte(numItems.mul(spotPrice), 'Input value incorrect');
  });

  it('getSellInfoExample', async function () {
    const spotPrice: BigNumber = utils.parseEther('3');
    const delta: BigNumber = utils.parseEther('0.1');
    const numItems: BigNumber = BigNumber.from('5');
    const feeMultiplier: BigNumber = utils.parseEther('0.005'); // 0.5%
    const protocolFeeMultiplier: BigNumber = utils.parseEther('0.003'); // 0.3%
    const quote = await curve.getSellInfo(spotPrice, delta, numItems, feeMultiplier, protocolFeeMultiplier);
    expect(quote.error).to.eq(0, 'Error code not OK');
    expect(quote.newSpotPrice).to.eq(utils.parseEther('2.5'), 'Error code not OK');
    expect(quote.newDelta).to.eq(utils.parseEther('0.1'), 'Delta incorrect');
    expect(quote.outputValue).to.eq(utils.parseEther('13.888'), 'Input value incorrect');
    expect(quote.protocolFee).to.eq(utils.parseEther('0.042'), 'Protocol fee incorrect');
  });

  it('getSellInfoWithoutFee', async function () {
    const spotPrice: BigNumber = utils.parseEther('3');
    const delta: BigNumber = utils.parseEther('0.1');
    const numItems: BigNumber = BigNumber.from('5');
    const quote = await curve.getSellInfo(spotPrice, delta, numItems, BigNumber.from(0), BigNumber.from(0));
    expect(quote.error).to.equal(0, 'Error code not OK');
    const totalPriceDecrease = delta.mul(numItems);
    if (spotPrice.lt(totalPriceDecrease)) {
      expect(quote.newSpotPrice).to.eq(0, 'New spot price not 0 when decrease is greater than current spot price');
    }
    if (spotPrice.gt(0)) {
      expect((quote.newSpotPrice.lt(spotPrice) && delta.gt(0)) || (quote.newSpotPrice.eq(spotPrice) && delta.eq(0))).to.eq(true, 'Price update incorrect');
    }
    expect(quote.outputValue).to.lte(numItems.mul(spotPrice), 'Input value incorrect');
  });
});