<script>
	import { onMount } from 'svelte';
	import { ethers } from 'ethers';
	import contractABI from '../contracts/ChatLog.json';
	import { Wave } from 'svelte-loading-spinners';
	import { fade } from 'svelte/transition';
	import MessageBox from '../components/MessageBox.svelte';
	import makeBlockie from 'ethereum-blockies-base64';
	import { GoerliSwitch, ShortenAddress } from '../scripts/w3Helpers.js';
	import Contact from '../components/Contact.svelte';

	let metaMaskInstalled = false;
	let connectedToGoerli = false;
	let waitingForTransaction = false;
	let abi = contractABI.abi;
	let contractAddress = '0xEEBc82A1bb3ab763a3ba8ABACeb0Ab6a6468d0Ea';
	// let contractAddress = "0xaB9d2D124E70Be7039d7CCba9AFd06AdC1Bc60C0"
	let provider;
	let contract;
	let signer;
	let balance;
	let address = '';
	let toAddress = '0x515335b2b1391E9b33753577F15f27E9bAEFa8b5';
	let account;
	let ensName;
	let tx = null;
	let confirmation = { blockNumber: null };
	let message = '';
	let isDisabled = false;
	let contractMessages = [];
	let contactList = [];
	let newContact = '';
	let isChatLoading = true;

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

	async function LoadChat() {
		isChatLoading = true;
		alert('click');
		console.log(this.id);
		toAddress = this.id;
		contractMessages = [...(await contract.getMessages(address, toAddress))];
		isChatLoading = false;
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
		return contract.sendMessage(toAddress, message);
	}

	async function ReadContract() {
		contract = new ethers.Contract(contractAddress, abi, signer);
		contractMessages = [...(await contract.getMessages(address, toAddress))];
		let listResponse = await contract.getContactList();
		let test = listResponse.map((contact) => {
			return {
				address: contact,
				name: ShortenAddress(contact),
				blockie: makeBlockie(contact)
			};
		});
		contactList = [...test];
		console.log(contractMessages);
		console.log(contactList);
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

	async function AddContact(address) {
		isDisabled = true;
		waitingForTransaction = true;
		contract = new ethers.Contract(contractAddress, abi, signer);
		tx = await contract.addContact(address);
		confirmation = await provider.getTransaction(tx.hash);
		while (confirmation.blockNumber == null) {
			await wait(1000);
			confirmation = await provider.getTransaction(tx.hash);
		}
		console.log(confirmation);
		waitingForTransaction = false;
		isDisabled = false;
	}
</script>

<div class="grid grid-cols-1 md:grid-cols-12 gap-x-2 gap-y-3">
	{#if !metaMaskInstalled}
		<div>Install MetaMask</div>
	{/if}
	{#if !connectedToGoerli}
		<div>
			<p>This dapp requires the Goerli testnet, please click the button below to change networks</p>
			<button class="btn" on:click={GoerliSwitch}>Switch to Goerli</button>
		</div>
	{:else}
		<div class="md:col-span-2">
			<input bind:value={newContact} />
			<button class="btn" on:click={AddContact(newContact)}>Add Contact</button>
			{#each contactList as contact (contact)}
				<Contact on:click={LoadChat} contact={contact.address} />
			{/each}
		</div>
		<div class="md:col-span-8">
			{#each contractMessages as message (message)}
				<MessageBox
					sender={message.sender}
					timestamp={message.timestamp}
					message={message.message}
				/>
			{/each}
			<input
				class="w-full bg-slate-800 border-2 border-slate-900 pt-2 pb-2 pl-6 pr-6"
				bind:value={message}
				type="text"
				placeholder="+Message"
			/>
		</div>
	{/if}
</div>

<div class="flex flex-col">
	<button class="btn disabled:" on:click={Login}>Web3 Login</button>
	<p>{ensName ? ensName : address ? ShortenAddress(address) : 'No account'}</p>
	<p>{balance ? balance : 'No balance'}</p>
</div>

<div class="grid grid-cols-8 gap-4">
	<div class="col-span-4">
		<input bind:value={toAddress} type="text" placeholder="address" />

		<button disabled={isDisabled} class="btn" on:click={SendTransaction}>Send Message</button>
		<button disabled={isDisabled} class="btn" on:click={ReadContract}>Check Message</button>
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
				<a class="link link-accent" href="https://goerli.etherscan.io/tx/{tx.hash}" target="blank">
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

<style>
</style>
