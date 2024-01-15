<script lang="ts">
	import { carrier_codes, carrier_names, carrier_urls } from '$lib/utils';
	import { ArrowRight, XMark } from 'svelte-heros-v2';
	import TrackingStatus from './TrackingStatus.svelte';

	interface Tracking {
		carrier_code?: string;
		tracking_number?: string;
		tracking_url?: string;
	}

	export let tracking: Tracking[] = [];

	$: console.log('OrderSetTracking', tracking);
</script>

<div>
	{#each tracking as track, idx}
		<div class="flex gap-x-1">
			<p class="pr-1">{idx + 1}</p>
			<select
				class="block w-fit text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
				bind:value={track.carrier_code}
			>
				{#each [null, ...carrier_codes] as id, idx}
					<option value={id}>
						{!id ? '' : carrier_names?.[idx - 1] || id}
					</option>
				{/each}
			</select>
			<input
				class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
				type="text"
				autocomplete="off"
				placeholder="Tracking number"
				bind:value={track.tracking_number}
			/>
			<button
				class="hover:text-green-600"
				class:text-orange-500={!track.tracking_number || !track.carrier_code}
				class:invisible={!carrier_urls?.[track.carrier_code]}
				on:click={() => {
					if (!track.tracking_number || !track.carrier_code) return;
					let url = carrier_urls?.[track.carrier_code]?.(track.tracking_number);
					if (!url) return;
					track.tracking_url = url;
				}}
			>
				<ArrowRight size="24" />
			</button>
			<input
				class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
				type="text"
				autocomplete="off"
				placeholder="Tracking url"
				bind:value={track.tracking_url}
				on:dblclick={() => {
					if (!track?.tracking_url) return;
					window.open(track.tracking_url, '_blank');
				}}
			/>
			<button
				class="hover:text-red-600"
				on:click={() => {
					tracking = tracking.filter((v, i) => i !== idx);
				}}
			>
				<XMark />
			</button>
		</div>
	{:else}
		<slot />
	{/each}
</div>
