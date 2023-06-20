<script lang="ts">
	import { classes } from '$lib/utils';
	import { gql, getContextClient, queryStore } from '@urql/svelte';
	import {
		Avatar,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	export let partId: string = 'Unknown';

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
					manufacturer
					created_at
					updated_at
				}
			}
		`,
		variables: { partId }
	});
	$: partInfo = $partInfoStore?.data?.parts_by_pk;
	$: isGeneric = partInfo?.manufacturer === 'Generic';
</script>

{#if $partInfoStore.fetching}
	<p>Loading...</p>
{:else if $partInfoStore.error}
	<h1 class="text-red-600">Part query error</h1>
	<p class="text-red-600">{$partInfoStore.error.message}</p>
{:else}
	<div class="p-3">
		<div class="flex justify-between items-center mb-2">
			{#if partInfo?.image_url}
				<Avatar src={partInfo.image_url} alt={partInfo?.name} size="lg" />
			{/if}

			<!-- <Button size="xs">Follow</Button> -->
		</div>
		<div class={'text-base font-semibold leading-none text-gray-900 dark:text-white'}>
			{#if isGeneric}
				<p>{partInfo?.name}</p>
			{:else}
				<a
					target="_blank"
					href={`https://octopart.com/search?q=${partInfo?.name}&currency=GBP`}
					class={classes.link}
				/>
			{/if}
		</div>
		<div class="mb-3 text-sm font-normal">
			{#if partInfo?.manufacturer}
				<p>{partInfo.manufacturer}</p>
			{/if}
		</div>
		<div class="mb-4 text-sm font-light">
			{partInfo?.description}
		</div>
		{#if partInfo?.properties}
			{#each Object.entries(partInfo?.properties).map( (p) => [p[0].toUpperCase(), String(p[1]).toUpperCase()] ) as [name, value], idx}
				<p>{name}: {value}</p>
				{#if idx < partInfo.properties.length}
					<hr />
				{/if}
			{/each}
		{/if}
	</div>
{/if}
