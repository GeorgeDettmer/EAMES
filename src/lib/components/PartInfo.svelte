<script lang="ts">
	import { classes } from '$lib/utils';
	import { gql, getContextClient, queryStore } from '@urql/svelte';
	import { Hr, Tooltip } from 'flowbite-svelte';
	import List from './KnowledgeBase/List.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ArrowTopRightOnSquare, Cog, Cog8Tooth } from 'svelte-heros-v2';
	import ViewerFromJson from './ViewerFromJSON.svelte';
	import { capacitance } from '$lib/utils/electical';
	import { InfoCircleOutline } from 'flowbite-svelte-icons';
	export let partId: string = 'Unknown';
	export let partLinkVisible: boolean = true;
	export let kbVisible: boolean = false;
	export let galleryVisible: boolean = false;
	export let hasInfo = false;
	export let footprint = {};
	export let showPopoutButton = true;
	export let showFootprint = false;
	export let partInfo = {};

	$: partInfoStore = queryStore({
		client: getContextClient(),
		query: gql`
			query partInfo($partId: String!) {
				parts_data_by_pk(id: $partId) {
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
				parts_by_pk(id: $partId) {
					id
					name
					level
					part_data {
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
			}
		`,
		variables: { partId },
		requestPolicy: 'cache-and-network'
	});
	$: partInfo = $partInfoStore?.data?.parts_by_pk?.part_data || $partInfoStore?.data?.parts_data_by_pk;
	$: isGeneric = partInfo?.manufacturer?.toLowerCase() === 'generic';
	$: properties = Object.entries(partInfo?.properties || [])
		?.map((p) => [p[0].toUpperCase(), String(p[1]).toUpperCase()])
		?.sort();
	$: footprint = partInfo?.footprint;
	$: hasInfo = !!partInfo;

	let kbItems = 0;

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

{#if partId}
	{#if $partInfoStore.fetching}
		<p>Loading...</p>
	{:else if $partInfoStore.error}
		<h1 class="text-red-600">Part query error</h1>
		<p class="text-red-600">{$partInfoStore.error.message}</p>
	{:else if partInfo}
		<div class="p-1">
			<div class="flex">
				{#if partLinkVisible}
					<div
						class="text-base font-bold leading-none text-gray-900 dark:text-white flex space-x-1 py-0.5"
						class:italic={!$partInfoStore?.data?.parts_data_by_pk}
					>
						{#if isGeneric}
							<p>{partInfo?.name}</p>
						{:else}
							<a target="_blank" href={window.origin + '/part/' + (partInfo?.name || '')} class={classes.link}>
								{partInfo?.name}
							</a>
							<a target="_blank" href={`https://octopart.com/search?q=${partInfo?.name}&currency=GBP`} class={classes.link}>
								<InfoCircleOutline size="sm" />
							</a>
							<Tooltip defaultClass="py-1 px-2 text-xs">Open in Octopart</Tooltip>
						{/if}
					</div>
				{/if}

				{#if showPopoutButton}
					<!-- <div class="float-right ml-auto">
						<a href={window.origin + '/part/' + (partInfo?.name || '')} target="_blank">
							<ArrowTopRightOnSquare
								class="text-xs dark:text-white text-center cursor-pointer opacity-75 hover:opacity-100"
							/>
						</a>
					</div> -->
				{/if}
			</div>
			<div class="mb-1 text-sm font-normal">
				{#if partInfo?.manufacturer}
					<p>{partInfo.manufacturer}</p>
				{/if}
			</div>
			<div class="mb-1 text-sm font-semibold flex">
				<p>{partInfo?.description}</p>
				{#if ['THT', 'SMT'].includes(partInfo?.properties?.type?.toUpperCase())}
					<p class="ml-4 font-bold">({partInfo?.properties?.type?.toUpperCase()})</p>
				{/if}
			</div>
			<div class="flex">
				<div class="w-2/3">
					{#if partInfo?.properties && Object.keys(partInfo.properties).length > 0}
						<p class="font-semibold">Properties:</p>
						<hr />
						{#each properties as [name, value], idx}
							{@const propertyCount = Object.keys(partInfo.properties).length}
							<div>
								{#if 'CAPACITANCE' === name}
									<p class="text-sm">{name}: {Number(value)}/{capacitance(Number(value))}</p>
								{:else if 'RESISTANCE' === name}
									<p class="text-sm">{name}: {Number(value)}Ω</p>
								{:else}
									<p class="text-sm">{name}: {value}</p>
								{/if}

								{#if idx < propertyCount}
									<hr />
								{/if}
							</div>
						{/each}
					{/if}
				</div>
				<div class="w-1/3">
					<div class="mx-auto">
						{#if partInfo?.image_url && !image}
							<img src={partInfo.image_url} alt={partInfo?.name} class=" px-1 m-0 aspect-square max-h-32 max-w-fit" />
						{/if}
						{#if image && !galleryVisible}
							<img
								src={image}
								alt={partInfo?.name}
								class=" px-1 m-0 aspect-square max-h-32 max-w-fit"
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
					</div>
					{#if showFootprint}
						<ViewerFromJson json={footprint} height={200} />
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
{:else}{/if}
