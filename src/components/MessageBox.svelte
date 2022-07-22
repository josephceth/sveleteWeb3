<script>
	import dayjs from 'dayjs';
	import makeBlockie from 'ethereum-blockies-base64';
	import { ShortenAddress } from '../scripts/w3Helpers.js';
	export let sender;
	export let timestamp;
	export let message;
</script>

<div
	class="flex space-x-3 pt-5 pb-5 pl-6 pr-6 shadow rounded bg-slate-800 hover:bg-slate-700 text-white"
>
	<div class="shrink"><img class="chatBlockie" alt="blockie" src={makeBlockie(sender)} /></div>
	<div class="grow">
		<div class="">
			<div class="flex space-x-4">
				<div class="stat-title success shrink">{ShortenAddress(sender)}</div>
				<div class="stat-title success text-accent">
					{dayjs(new Date(timestamp.toString() * 1000).toString()).format('MM/DD/YYYY h:mm A')}
				</div>
			</div>
			<div class="stat-title success">{message}</div>
		</div>
	</div>
</div>

<style>
	.chatBlockie {
		min-width: 2rem;
		min-height: 2rem;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
	}
</style>
