<script>
	import { onMount } from 'svelte';
	import { ethers } from 'ethers';
	import contractABI from '../contracts/HelloBlockchain.json';
	import { Wave } from 'svelte-loading-spinners';
	import { fade } from 'svelte/transition';

	let metaMaskInstalled = false;
	let connectedToGoerli = false;
	let waitingForTransaction = false;
	let abi = contractABI.abi;
	let contractAddress = '0x15a4EBFe6bA13348cd5528043b1545811013C01C';
	let provider;
	let contract;
	let signer;
	let balance;
	let address = '';
	let account;
	let ensName;
	let tx = null;
	let confirmation = { blockNumber: null };
	let message = '';
	let isDisabled = false;
	let contractMessage = '';

	$: shortenedAddress = `${address.substring(0, 6)}....${address.substring(
		address.length - 4,
		address.length
	)}`;

	onMount(() => {
		if (window.ethereum) {
			metaMaskInstalled = true;
			provider = new ethers.providers.Web3Provider(window.ethereum);
			window.ethereum.on('accountsChanged', accountWasChanged);
			window.ethereum.on('chainChanged', chainWasChanged);
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

	function UpdateContract() {
		contract = new ethers.Contract(contractAddress, abi, signer);
		return contract.SendRequest(message);
	}

	async function ReadContract() {
		contract = new ethers.Contract(contractAddress, abi, signer);
		contractMessage = await contract.message();
	}

	const wait = function (ms = 1000) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	};

	async function SendTransaction() {
		isDisabled = true;
		waitingForTransaction = true;
		tx = await UpdateContract();
		confirmation = await provider.getTransaction(tx.hash);
		while (confirmation.blockNumber == null) {
			await wait(1000);
			confirmation = await provider.getTransaction(tx.hash);
		}
		console.log(confirmation);
		waitingForTransaction = false;
		isDisabled = false;
	}

	async function GoerliSwitch() {
		return window.ethereum.request({
			method: 'wallet_switchEthereumChain',
			params: [{ chainId: '0x5' }]
		});
	}
</script>

<div class="flex flex-col">
	<button class="btn disabled:" on:click={Login}>Web3 Login</button>
	<p>{ensName ? ensName : address ? shortenedAddress : 'No account'}</p>
	<p>{balance ? balance : 'No balance'}</p>
</div>

{#if !metaMaskInstalled}
	Install MetaMask
{/if}

{#if !connectedToGoerli}
	<p>This dapp requires the Goerli testnet, please click the button below to change networks</p>
	<button class="btn" on:click={GoerliSwitch}>Switch to Goerli</button>
{:else}
	<div class="grid grid-cols-8 gap-4">
		<div class="col-span-4">
			<input bind:value={message} type="text" placeholder="Message" />
			<button disabled={isDisabled} class="btn" on:click={SendTransaction}>Send Message</button>
			<button disabled={isDisabled} class="btn" on:click={ReadContract}>Check Message</button>
			<p>{contractMessage}</p>
		</div>
		<div class="col-span-4">
			{#if waitingForTransaction}
				<div class="flex flex-col">
					<Wave size="40" color="#FF3E00" unit="px" duration="1s" />
				</div>
				{#if tx != null}
					<div transition:fade>
						<p>Waiting for transaction to be mined...</p>
						<p>{tx.hash}</p>
						<a
							class="link link-accent"
							href="https://goerli.etherscan.io/tx/{tx.hash}"
							target="blank"
						>
							View on EtherScan
						</a>
					</div>
				{/if}
			{/if}
			{#if confirmation.blockNumber != null}
				<div transition:fade>
					<p>Transaction was successful!</p>
					<p>
						{tx.hash.substring(0, 6)}....{tx.hash.substring(tx.hash.length - 5, tx.hash.length)}
					</p>
					<a
						class="link link-accent"
						href="https://goerli.etherscan.io/tx/{tx.hash}"
						target="blank"
					>
						View on EtherScan
					</a>

					<p>Block Number: {confirmation.blockNumber}</p>
					<a
						class="link link-accent"
						href="https://goerli.etherscan.io/block/{confirmation.blockNumber}"
						target="blank"
					>
						View on EtherScan
					</a>
				</div>
			{/if}
		</div>
	</div>
{/if}
