<script>
	import makeBlockie from 'ethereum-blockies-base64';
	import { ShortenAddress } from '../scripts/w3Helpers.js';
	export let contact;
</script>

<div on:click id={contact} class="stat shadow rounded bg-neutral">
	<img alt="blockie" src={makeBlockie(contact)} />
	<div class="stat-title success">{ShortenAddress(contact)}</div>
</div>

<style>
	img {
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
	}
</style>
