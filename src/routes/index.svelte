<script>
	import { onMount } from 'svelte';
	import { ethers } from 'ethers';
	import { Wave } from 'svelte-loading-spinners';
	import contractABI from '../contracts/HelloBlockchain.json';

	let wallet = [];
	let address = '';
	let provider = null;
	let balance = null;
	let ensName = '';
	let contractAddress = '0x15a4EBFe6bA13348cd5528043b1545811013C01C';
	let abi = contractABI.abi;
	let contract;
	let message;
	let button;
	let waitingForTransaction = false;

	console.log(abi);

	onMount(() => {
		button = document.querySelector('button');
	});

	const wait = function (ms = 1000) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	};

	async function getAccounts() {
		provider = new ethers.providers.Web3Provider(window.ethereum);
		await provider.send('eth_requestAccounts', []);
		wallet = provider.getSigner(); //await ethereum.request({ method: 'eth_requestAccounts' });
		console.log(wallet);
		address = await wallet.getAddress();
		balance = await wallet.getBalance();
		// provider.getBalance(account).then(balance => {
		//     console.log(balance);
		// });
		ensName = await provider.lookupAddress(address);
	}

	async function ButtonClick() {
		let tx = await SendMessage();
		waitingForTransaction = true;
		console.log(tx);

		let txn_test = await provider.getTransaction(tx.hash);
		while (txn_test.blockNumber == null) {
			await wait(1000);
			txn_test = await provider.getTransaction(tx.hash);
			console.log('try again');
		}
		waitingForTransaction = false;
		console.log('txn_test: ');
		console.log(txn_test);
	}

	async function SendMessage() {
		contract = new ethers.Contract(contractAddress, abi, wallet);
		// let gasEst = await contract.estimateGas.SendRequest(wallet);
		// console.log(ethers.utils.formatUnits(gasEst, 'gwei'));
		//return contract.SendRequest(message);
		return contract.SendRequest(message);
	}

	async function CheckMessage() {
		console.log(wallet);
		contract = new ethers.Contract(contractAddress, abi, wallet);
		let response = await contract.message();
		console.log(response);
	}

	async function GoerliSwitch() {
		return window.ethereum.request({
			method: 'wallet_switchEthereumChain',
			params: [
				{
					chainId: '0x5'
					// rpcUrls: ['https://goerli.infura.io/v3/'],
					// chainName: 'Goerli Test Network',
					// nativeCurrency: {
					// 	name: 'ETH',
					// 	symbol: 'ETH',
					// 	decimals: 18
					// },
					// blockExplorerUrls: ['https://goerli.etherscan.io/']
				}
			]
		});
	}

	async function polygonSwitch() {
		await window.ethereum.request({
			method: 'wallet_addEthereumChain',
			params: [
				{
					chainId: '0x89',
					rpcUrls: ['https://polygon-rpc.com/'],
					chainName: 'Matic Mainnet',
					nativeCurrency: {
						name: 'MATIC',
						symbol: 'MATIC',
						decimals: 18
					},
					blockExplorerUrls: ['https://explorer.matic.network']
				}
			]
		});
		balance = await wallet.getBalance();
	}
</script>

<p>{address}</p>
<p>{balance}</p>
<p>{ensName} Name</p>

<div class="flex space-x-4">
	<button class="btn" on:click={getAccounts}>Web3 Login</button>
	<button class="btn" on:click={polygonSwitch}>Switch to Polygon</button>
	<button class="btn" on:click={GoerliSwitch}>Switch to Goerli</button>
	<button class="btn" on:click={ButtonClick}>sendMessage</button>
	<button class="btn" on:click={CheckMessage}>checkMessage</button>
	<input bind:value={message} />
</div>

{#if waitingForTransaction}
	<div class="flex flex-col">
		<p>Please wait for confirmation</p>
		<Wave size="30" color="#FF3E00" unit="px" duration="1s" />
	</div>
{/if}
