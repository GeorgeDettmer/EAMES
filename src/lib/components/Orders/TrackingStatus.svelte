<script context="module" lang="ts">
	let trackCache: Map<string, Record<string, any>> = new Map();
</script>

<script lang="ts">
	import { datetimeFormat } from '$lib/utils';
	import type { Placement } from '@popperjs/core';
	import { error } from '@sveltejs/kit';
	import { Popover, Spinner, Tooltip } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	const ENABLE_LOCAL_CACHE = false;
	onMount(() => {
		if (ENABLE_LOCAL_CACHE) console.log('local cache:', trackCache);
	});

	interface TrackingDetails {
		tracking_url: string;
		tracking_number: string;
		carrier_code: string;
	}
	export let tracking: TrackingDetails | null = null;
	export let isDelivered: boolean | undefined = undefined;
	export let showText: boolean = true;
	export let width: number = 24;
	export let height: number = 24;
	export let showPopover: boolean = true;
	export let popoverPlacement: Placement = 'left';
	async function track(tracking: string, carrier: string) {
		if (!tracking || !carrier) return {};
		let cacheId = `${carrier}_${tracking}`;
		if (ENABLE_LOCAL_CACHE && trackCache.has(cacheId)) {
			return trackCache.get(cacheId);
		}
		const response = await fetch(`/api/shipengine/track?tracking_number=${tracking}&carrier_code=${carrier}`);
		const result = await response.json();
		if (result?.statusCode) {
			//console.log('tracking request success', tracking, carrier, result);
			trackCache.set(cacheId, await result);
			//console.log('local cached', cacheId, trackCache.get(cacheId));
			return result;
		} else {
			console.log('tracking request fail', tracking, carrier, response);
			return { error: response.status };
		}
	}

	export let trackingResult = null;
	$: {
		if (tracking?.tracking_number && tracking?.carrier_code) {
			track(tracking?.tracking_number, tracking?.carrier_code).then((result) => (trackingResult = result));
		}
	}
</script>

<div>
	{#if isDelivered !== undefined}
		{#if isDelivered}
			<div class="flex">
				<img
					style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(70deg)"
					{width}
					{height}
					src="https://img.icons8.com/windows/32/delivered-box.png"
					alt="delivered-box"
				/>
				{#if showText}
					<p class="font-semibold pt-1 pl-2 uppercase text-xs">Delivered</p>
				{/if}
			</div>
		{:else}
			<div class="flex">
				<img
					style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(800%) hue-rotate(150deg)"
					{width}
					{height}
					src="https://img.icons8.com/ios-glyphs/30/delivery--v1.png"
					alt="delivery--v1"
				/>
				{#if showText}
					<p class="font-semibold pt-1 pl-2 uppercase text-xs">In Transit</p>
				{/if}
			</div>
		{/if}
	{:else if trackingResult?.statusCode}
		<a target="_blank" href={tracking?.tracking_url}>
			<div class="flex">
				{#if trackingResult?.statusCode === 'DE'}
					<img
						style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(900%) hue-rotate(70deg)"
						{width}
						{height}
						src="https://img.icons8.com/ios-glyphs/30/shipped--v1.png"
						alt="delivered-box"
					/>
				{:else if trackingResult?.statusCode === 'EX'}
					<img
						style="filter: brightness(0) saturate(100%) invert(90%) sepia(97%) saturate(925%) hue-rotate(360deg)"
						{width}
						{height}
						src="https://img.icons8.com/windows/32/package--v2.png"
						alt="package--v2"
					/>
				{:else if trackingResult?.statusCode === 'IT'}
					<img
						style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(800%) hue-rotate(150deg)"
						{width}
						{height}
						src="https://img.icons8.com/ios-glyphs/30/delivery--v1.png"
						alt="delivery--v1"
					/>
				{:else}
					<img {width} {height} src="https://img.icons8.com/windows/32/box-other.png" alt="box-other" />
				{/if}
				{#if showText}
					<p class="font-semibold pt-1 pl-2 uppercase text-xs">{trackingResult?.statusDescription || ''}</p>
				{:else if showPopover}
					<Tooltip placement={popoverPlacement}>{trackingResult?.statusDescription || ''}</Tooltip>
				{/if}
			</div>
			{#if showPopover}
				<Popover placement={popoverPlacement} defaultClass="py-1 px-2">
					<div class="text-xs">
						{#if trackingResult?.events?.[0]}
							<p>
								{trackingResult?.statusDescription || ''}
								<em>({datetimeFormat(trackingResult?.events?.[0]?.occurredAt)})</em>
							</p>
							<p>
								{trackingResult?.events?.[0]?.description || ''}
							</p>
							<!-- 					<p>{trackingResult?.events?.[0]?.cityLocality || ''} {trackingResult?.events?.[0]?.countryCode || ''}</p>
 -->
							{#if trackingResult?.events?.[0]?.signer}
								<p>Signed: {trackingResult?.events?.[0]?.signer}</p>
							{/if}
						{:else}
							<p>No tracking events</p>
						{/if}
					</div>
				</Popover>
			{/if}
		</a>
	{:else if tracking?.tracking_url}
		<a target="_blank" href={tracking.tracking_url}>
			<div class="flex">
				<!-- <img {width} {height} src="https://img.icons8.com/windows/32/box-other.png" alt="box-other" /> -->
				<div class="my-auto"><Spinner size="4" color={trackingResult?.error?.status !== 200 ? 'red' : 'blue'} /></div>
			</div>
		</a>
	{:else}
		<div class="flex">
			<img {width} {height} src="https://img.icons8.com/windows/32/box-other.png" alt="box-other" />
			{#if showText}
				<p class="font-semibold pt-1 pl-2 uppercase text-xs">No tracking</p>
			{:else if showPopover}
				<Tooltip placement={popoverPlacement}>No tracking</Tooltip>
			{/if}
		</div>
	{/if}
</div>
