import 'dotenv/config';
import { BigNumber, ContractTransaction } from 'ethers';
import { ethers } from "hardhat";

async function main() {
  // Deploy pair templates
  const LSSVMPairEnumerableETH = await ethers.getContractFactory('LSSVMPairEnumerableETH');
  const lssvmPairEnumerableETH = await LSSVMPairEnumerableETH.deploy();
  await lssvmPairEnumerableETH.deployed();
  console.log(`LSSVMPairEnumerableETH deployed at:${lssvmPairEnumerableETH.address}`);

  const LSSVMPairMissingEnumerableETH = await ethers.getContractFactory('LSSVMPairMissingEnumerableETH');
  const lssvmPairMissingEnumerableETH = await LSSVMPairMissingEnumerableETH.deploy();
  await lssvmPairMissingEnumerableETH.deployed();
  console.log(`LSSVMPairMissingEnumerableETH deployed at:${lssvmPairMissingEnumerableETH.address}`);

  const LSSVMPairEnumerableERC20 = await ethers.getContractFactory('LSSVMPairEnumerableERC20');
  const lssvmPairEnumerableERC20 = await LSSVMPairEnumerableERC20.deploy();
  await lssvmPairEnumerableERC20.deployed();
  console.log(`LSSVMPairEnumerableERC20 deployed at:${lssvmPairEnumerableERC20.address}`);

  const LSSVMPairMissingEnumerableERC20 = await ethers.getContractFactory('LSSVMPairMissingEnumerableERC20');
  const lssvmPairMissingEnumerableERC20 = await LSSVMPairMissingEnumerableERC20.deploy();
  await lssvmPairMissingEnumerableERC20.deployed();
  console.log(`LSSVMPairMissingEnumerableERC20 deployed at:${lssvmPairMissingEnumerableERC20.address}`);

  // Deploy factory
  const protocolFeeRecipient: string = process.env.PROTOCOL_FEE_RECIPIENT as string;
  const protocolFeeMultiplier: string = process.env.PROTOCOL_FEE_MULTIPLIER as string;
  const LSSVMPairFactory = await ethers.getContractFactory('LSSVMPairFactory');
  const lssvmPairFactory = await LSSVMPairFactory.deploy(
    lssvmPairEnumerableETH.address,
    lssvmPairMissingEnumerableETH.address,
    lssvmPairEnumerableERC20.address,
    lssvmPairMissingEnumerableERC20.address,
    protocolFeeRecipient,
    BigNumber.from(protocolFeeMultiplier)
  );
  await lssvmPairFactory.deployed();
  console.log(`LSSVMPairFactory deployed at:${lssvmPairFactory.address}`);

  // Deploy router
  const LSSVMRouter = await ethers.getContractFactory('LSSVMRouter');
  const lssvmRouter = await LSSVMRouter.deploy(lssvmPairFactory.address);
  await lssvmRouter.deployed();
  console.log(`LSSVMRouter deployed at:${lssvmRouter.address}`);

  // Whitelist router in factory
  const setRouterTransaction: ContractTransaction = await lssvmPairFactory.setRouterAllowed(lssvmRouter.address, true);
  await setRouterTransaction.wait();
  console.log(`Whitelisted router in factory`);

  // Deploy bonding curves
  const ExponentialCurve = await ethers.getContractFactory('ExponentialCurve');
  const exponentialCurve = await ExponentialCurve.deploy();
  await exponentialCurve.deployed();
  console.log(`ExponentialCurve deployed at:${exponentialCurve.address}`);

  const LinearCurve = await ethers.getContractFactory('LinearCurve');
  const linearCurve = await LinearCurve.deploy();
  await linearCurve.deployed();
  console.log(`LinearCurve deployed at:${linearCurve.address}`);

  // Whitelist bonding curves in factory
  const setExponentialTransaction: ContractTransaction = await lssvmPairFactory.setBondingCurveAllowed(exponentialCurve.address, true);
  await setExponentialTransaction.wait();
  console.log(`Whitelisted exponential curve in factory`);

  const setLinearTransaction: ContractTransaction = await lssvmPairFactory.setBondingCurveAllowed(linearCurve.address, true);
  await setLinearTransaction.wait();
  console.log(`Whitelisted linear curve in factory`);

  // Transfer factory ownership to admin
  const admin: string = process.env.ADMIN as string;
  const transferOwnershipTransaction: ContractTransaction = await lssvmPairFactory.transferOwnership(admin);
  await transferOwnershipTransaction.wait();
  console.log(`Transferred factory ownership to:${admin}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
