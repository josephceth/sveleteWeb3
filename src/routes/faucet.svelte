<script>
	import { onMount } from 'svelte';
	import { ethers } from 'ethers';
	import contractABI from '../contracts/Faucet.json';
	import { Wave } from 'svelte-loading-spinners';
	import { fade } from 'svelte/transition';
	import { GoerliSwitch, ShortenAddress, wait } from '../scripts/w3Helpers.js';

	const faucetAddress = import.meta.env.VITE_FAUCET_ADDRESS;
	let metaMaskInstalled = false;
	let connectedToGoerli = false;
	let waitingForTransaction = false;
	let abi = contractABI.abi;
	// let contractAddress = "0xaB9d2D124E70Be7039d7CCba9AFd06AdC1Bc60C0"
	let provider;
	let signer;
	let balance;
	let address = '';
	let account;
	let ensName;
	let tx = null;
	let confirmation = { blockNumber: null };
	let isDisabled = false;
	let faucetBalance = 0;

	onMount(() => {
		if (window.ethereum) {
			metaMaskInstalled = true;
			provider = new ethers.providers.Web3Provider(window.ethereum);
			window.ethereum.on('accountsChanged', accountWasChanged);
			window.ethereum.on('chainChanged', chainWasChanged);
			GetFaucetBalance();
			Login();
			return;
		}
		metaMaskInstalled = false;
	});

	function chainWasChanged() {
		account = null;
		address = '';
		signer = null;
		balance = null;
		location.reload();
	}

	const accountWasChanged = async (accounts) => {
		console.log('accountWasChanged');

		if (accounts.length === 0) {
			console.log('Wallet is locked');
			account = null;
			address = '';
			signer = null;
			balance = null;
			return;
		}

		if (accounts.length > 0) {
			Login();
		}
	};

	async function GetFaucetBalance() {
		faucetBalance = ethers.utils.formatEther(await provider.getBalance(faucetAddress));
	}

	async function CallFaucet() {
		try {
			waitingForTransaction = true;
			const response = await fetch(`/api/faucet/${address}.json`);
			if (response.status !== 200) {
				alert(`Error ${await response.text()}`);
				return;
			}
			const tx = await response.json();
			confirmation = await provider.getTransaction(tx.txnHash.hash);
			while (confirmation.blockNumber == null) {
				await wait(1000);
				confirmation = await provider.getTransaction(tx.txnHash.hash);
			}
			waitingForTransaction = false;
		} catch (error) {
			console.log(error);
			alert(error);
			waitingForTransaction = false;
		}
	}

	async function EmptyFaucet() {
		try {
			const response = await fetch(`/api/faucet/empty.json`);
			if (response.status !== 200) {
				alert(`Error ${await response.text()}`);
				return;
			}
			const tx = await response.json();
			confirmation = await provider.getTransaction(tx.txnHash.hash);
			while (confirmation.blockNumber == null) {
				await wait(1000);
				confirmation = await provider.getTransaction(tx.txnHash.hash);
			}
		} catch (error) {
			console.log(error);
			alert(error);
		}
	}

	async function ClearFaucet() {
		try {
			waitingForTransaction = true;
			const response = await fetch(`/api/faucet/clear.json`);
			if (response.status !== 200) {
				alert(`Error ${await response.text()}`);
				return;
			}
			const tx = await response.json();
			confirmation = await provider.getTransaction(tx.txnHash.hash);
			while (confirmation.blockNumber == null) {
				await wait(1000);
				confirmation = await provider.getTransaction(tx.txnHash.hash);
			}
			waitingForTransaction = false;
		} catch (error) {
			console.log(error);
			alert(error);
			waitingForTransaction = false;
		}
	}

	async function Login() {
		let accounts = await provider.send('eth_requestAccounts', []);
		account = accounts[0];
		signer = provider.getSigner();
		window.ethereum.networkVersion === '5'
			? (connectedToGoerli = true)
			: (connectedToGoerli = false);
		address = await signer.getAddress();
		balance = parseFloat(ethers.utils.formatUnits(await signer.getBalance(), 'ether')).toFixed(4);
		ensName = await provider.lookupAddress(account);
	}
</script>

{#if !metaMaskInstalled}
	<div>Install MetaMask</div>
{/if}
{#if !connectedToGoerli}
	<div>
		<p>This dapp requires the Goerli testnet, please click the button below to change networks</p>
		<button class="btn" on:click={GoerliSwitch}>Switch to Goerli</button>
	</div>
{:else}
	<input bind:value={address} type="text" placeholder="address" />
	{balance}
	{faucetBalance}
	<button disabled={isDisabled} class="btn" on:click={CallFaucet}>Send Message</button>
	<button disabled={isDisabled} class="btn" on:click={EmptyFaucet}>Empty</button>
	<button disabled={isDisabled} class="btn" on:click={ClearFaucet}>CLEAR</button>
{/if}
{#if waitingForTransaction}
	<div class="flex flex-col">
		<Wave size="40" color="#FF3E00" unit="px" duration="1s" />
	</div>
	{#if tx != null}
		<div transition:fade>
			<p>Waiting for transaction to be mined...</p>
			<p>{tx.hash}</p>
			<a class="link link-accent" href="https://goerli.etherscan.io/tx/{tx.hash}" target="blank">
				View on EtherScan
			</a>
		</div>
	{/if}
{/if}
