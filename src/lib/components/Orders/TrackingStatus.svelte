<script context="module" lang="ts">
	let trackCache: Map<string, Record<string, any>> = new Map();
</script>

<script lang="ts">
	import { datetimeFormat } from '$lib/utils';
	import { Popover, Spinner } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	const ENABLE_LOCAL_CACHE = false;
	onMount(() => {
		console.log('local cache:', trackCache);
	});

	interface TrackingDetails {
		tracking_url: string;
		tracking_number: string;
		carrier_code: string;
	}
	export let tracking: TrackingDetails | null = null;
	export let isDelivered: boolean | undefined = undefined;
	async function track(tracking: string, carrier: string) {
		if (!tracking || !carrier) return {};
		let cacheId = `${carrier}_${tracking}`;
		if (ENABLE_LOCAL_CACHE && trackCache.has(cacheId)) {
			return trackCache.get(cacheId);
		}
		const response = await fetch(`/api/shipengine/track?tracking_number=${tracking}&carrier_code=${carrier}`);
		const result = await response.json();
		if (result?.statusCode) {
			console.log('tracking request success', tracking, carrier, result);
			trackCache.set(cacheId, await result);
			console.log('local cached', cacheId, trackCache.get(cacheId));
			return result;
		} else {
			console.log('tracking request fail', tracking, carrier, response);
		}
	}

	export let trackingResult = null;
	$: {
		if (tracking?.tracking_number && tracking?.carrier_code) {
			track(tracking?.tracking_number, tracking?.carrier_code).then((result) => (trackingResult = result));
		}
	}
</script>

{#if isDelivered !== undefined}
	{#if isDelivered}
		<div class="flex">
			<img
				style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(70deg)"
				width="24"
				height="24"
				src="https://img.icons8.com/windows/32/delivered-box.png"
				alt="delivered-box"
			/>
			<p class="font-semibold pt-1 pl-2 uppercase text-xs">Delivered</p>
		</div>
	{:else}
		<div class="flex">
			<img
				style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(800%) hue-rotate(150deg)"
				width="24"
				height="24"
				src="https://img.icons8.com/ios-glyphs/30/delivery--v1.png"
				alt="delivery--v1"
			/>
			<p class="font-semibold pt-1 pl-2 uppercase text-xs">In Transit</p>
		</div>
	{/if}
{:else if trackingResult?.statusCode}
	<a target="_blank" href={tracking?.tracking_url}>
		<div class="flex">
			{#if trackingResult?.statusCode === 'DE'}
				<img
					style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(70deg)"
					width="24"
					height="24"
					src="https://img.icons8.com/windows/32/delivered-box.png"
					alt="delivered-box"
				/>
			{:else if trackingResult?.statusCode === 'EX'}
				<img
					style="filter: brightness(0) saturate(100%) invert(90%) sepia(97%) saturate(925%) hue-rotate(360deg)"
					width="24"
					height="24"
					src="https://img.icons8.com/windows/32/package--v2.png"
					alt="package--v2"
				/>
			{:else if trackingResult?.statusCode === 'IT'}
				<img
					style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(800%) hue-rotate(150deg)"
					width="24"
					height="24"
					src="https://img.icons8.com/ios-glyphs/30/delivery--v1.png"
					alt="delivery--v1"
				/>
			{:else}
				<img width="24" height="24" src="https://img.icons8.com/windows/32/box-other.png" alt="box-other" />
			{/if}
			<p class="font-semibold pt-1 pl-2 uppercase text-xs">{trackingResult?.statusDescription || ''}</p>
		</div>
		<Popover placement={'left'}>
			{#if trackingResult?.events?.[0]}
				<p>
					{trackingResult?.statusDescription || ''}
					<em>({datetimeFormat(trackingResult?.events?.[0]?.occurredAt)})</em>
				</p>
				<p>
					{trackingResult?.events?.[0]?.description || ''}
				</p>
				<p>{trackingResult?.events?.[0]?.cityLocality || ''} {trackingResult?.events?.[0]?.countryCode || ''}</p>
				{#if trackingResult?.events?.[0]?.signer}
					<p>Signed: {trackingResult?.events?.[0]?.signer}</p>
				{/if}
			{/if}
		</Popover>
	</a>
{:else if tracking?.tracking_url}
	<a target="_blank" href={tracking.tracking_url}>
		<div class="flex">
			<img width="24" height="24" src="https://img.icons8.com/windows/32/box-other.png" alt="box-other" />
			<Spinner size="6" />
		</div>
	</a>
{:else}
	<div class="flex">
		<img width="24" height="24" src="https://img.icons8.com/windows/32/box-other.png" alt="box-other" />
		<p class="font-semibold pt-1 pl-2 uppercase text-xs">No tracking</p>
	</div>
{/if}
