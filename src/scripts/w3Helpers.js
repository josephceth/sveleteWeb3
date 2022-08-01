export async function GoerliSwitch() {
	return window.ethereum.request({
		method: 'wallet_switchEthereumChain',
		params: [{ chainId: '0x5' }]
	});
}

export function ShortenAddress(address) {
	return `${address.substring(0, 6)}....${address.substring(address.length - 4, address.length)}`;
}

export async function Login(provider) {
	let accounts = await provider.send('eth_requestAccounts', []);
	account = accounts[0];
	signer = provider.getSigner();
	window.ethereum.networkVersion === '5' ? (connectedToGoerli = true) : (connectedToGoerli = false);
	address = await signer.getAddress();
	balance = parseFloat(ethers.utils.formatUnits(await signer.getBalance(), 'ether')).toFixed(4);
	ensName = await provider.lookupAddress(account);
}

export function wait(ms = 1000) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
