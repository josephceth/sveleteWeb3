import * as ethers from 'ethers';
import { abi } from '../../../contracts/Faucet.json';
import 'dotenv/config';

const faucetAddress = process.env.FAUCET_ADDRESS;

export const GET = async () => {
	let provider = new ethers.providers.JsonRpcProvider(process.env.GOERLI_URL);
	let wallet = new ethers.Wallet(process.env.DEV_WALLET, provider);
	let faucetBalance = await provider.getBalance(faucetAddress);
	var contract = null;
	try {
		contract = new ethers.Contract(faucetAddress, abi, wallet);
		let txn = await contract.emptyFaucet(faucetBalance);
		return {
			status: 200,
			body: { txnHash: txn }
		};
	} catch (error) {
		return {
			status: 500,
			body: { error: error.error.reason }
		};
	}
};
