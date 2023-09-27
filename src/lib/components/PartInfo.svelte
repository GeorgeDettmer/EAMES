<script lang="ts">
	import { classes } from '$lib/utils';
	import { gql, getContextClient, queryStore } from '@urql/svelte';
	import { Hr } from 'flowbite-svelte';
	import List from './KnowledgeBase/List.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ArrowTopRightOnSquare } from 'svelte-heros-v2';
	export let partId: string = 'Unknown';
	export let partLinkVisible: boolean = true;
	export let kbVisible: boolean = false;
	export let galleryVisible: boolean = false;
	export let hasInfo = false;
	export let footprint = {};
	export let showPopoutButton = true;

	$: partInfoStore = queryStore({
		client: getContextClient(),
		query: gql`
			query partInfo($partId: String!) {
				parts_by_pk(id: $partId) {
					id
					name
					description
					properties
					image_url
					images
					manufacturer
					created_at
					updated_at
					kb
					footprint
				}
			}
		`,
		variables: { partId },
		requestPolicy: 'cache-and-network'
	});
	$: partInfo = $partInfoStore?.data?.parts_by_pk;
	$: isGeneric = partInfo?.manufacturer?.toLowerCase() === 'generic';
	$: properties = Object.entries(partInfo?.properties || [])
		?.map((p) => [p[0].toUpperCase(), String(p[1]).toUpperCase()])
		?.sort();
	$: footprint = partInfo?.footprint;
	$: hasInfo = !!partInfo;

	let kbItems = 0;
	$: console.log('kbItems', kbItems);

	$: images = partInfo?.images || [];
	let imageIdx = 0;
	$: image = images?.[imageIdx];
	let imageInterval = 2000;
	onMount(() => {
		if (!images) return;
		setInterval(() => {
			imageIdx++;
			if (imageIdx > images.length - 1) {
				imageIdx = 0;
			}
			image = images[imageIdx];
		}, imageInterval);
	});
</script>

{#if $partInfoStore.fetching}
	<p>Loading...</p>
{:else if $partInfoStore.error}
	<h1 class="text-red-600">Part query error</h1>
	<p class="text-red-600">{$partInfoStore.error.message}</p>
{:else if partInfo}
	<div class="p-1">
		<div class="flex">
			{#if partLinkVisible}
				<div class={'text-base font-semibold leading-none text-gray-900 dark:text-white'}>
					{#if isGeneric}
						<p>{partInfo?.name}</p>
					{:else}
						<a target="_blank" href={`https://octopart.com/search?q=${partInfo?.name}&currency=GBP`} class={classes.link}
							>{partInfo?.name}</a
						>
					{/if}
				</div>
			{/if}

			{#if showPopoutButton}
				<div class="float-right ml-auto">
					<a href={window.origin + '/part/' + (partInfo?.name || '')} target="_blank">
						<ArrowTopRightOnSquare class="text-xs dark:text-white text-center cursor-pointer opacity-75 hover:opacity-100" />
					</a>
				</div>
			{/if}
		</div>
		<div class="mb-1 text-sm font-normal">
			{#if partInfo?.manufacturer}
				<p>{partInfo.manufacturer}</p>
			{/if}
		</div>
		<div class="mb-1 text-sm font-light">
			{partInfo?.description}
		</div>
		{#if partInfo?.properties}
			<p class="font-semibold">Properties:</p>
			<hr />
			{#each properties as [name, value], idx}
				{@const propertyCount = Object.keys(partInfo.properties).length}
				<p class="text-sm">{name}: {value}</p>
				{#if idx < propertyCount}
					<hr />
				{/if}
			{/each}
		{/if}
		<div class="flex items-center mb-0">
			{#if partInfo?.image_url && !image}
				<img src={partInfo.image_url} alt={partInfo?.name} class="w-1/4 p-0 m-0" />
			{/if}
			{#if image && !galleryVisible}
				<img
					src={image}
					alt={partInfo?.name}
					class="w-1/4 p-0 m-0 aspect-square"
					on:click={() => {
						imageIdx++;
						imageInterval = 2000;
						if (imageIdx > images.length - 1) {
							imageIdx = 0;
						}
					}}
				/>
			{/if}

			<div>
				{#if galleryVisible && images.length > 0}
					<div class="grid md:grid-cols-3 sm:grid-cols-2">
						{#each images as image}
							<a href={image} target="_blank" class="border rounded-lg p-1 mx-1 my-1 hover:shadow-inner">
								<img src={image} class="w-fit aspect-auto" alt={image} />
							</a>
						{/each}
					</div>
				{/if}
			</div>
			<slot />
			<!-- <Button size="xs">Info</Button> -->
		</div>
		{#if kbVisible && partInfo?.kb}
			<div>
				<Hr class="pb-1">
					🧾
					{#if $page?.data?.user}
						<a class="cursor-pointer" target="_blank" href={window.origin + '/kb/' + partInfo?.kb}>➕</a>
					{/if}
				</Hr>
			</div>
			<div class="py-2 overflow-y-auto overflow-x-hidden h-44">
				<List kbId={partInfo?.kb} bind:kbItems />
			</div>
		{/if}
	</div>
{:else}
	<div class={'text-base font-semibold leading-none text-gray-900 dark:text-white'}>Part info unavailable...</div>
{/if}
