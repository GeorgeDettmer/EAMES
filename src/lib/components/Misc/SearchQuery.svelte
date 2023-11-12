<script lang="ts">
	import { queryStore, getContextClient } from '@urql/svelte';
	import { Input } from 'flowbite-svelte';

	interface Serachable {
		text: string;
		value: any;
	}
	let searchables: Serachable[];
	export let query: string = '';
	export let variables: any[] = [];

	$: searchQueryStore = queryStore({
		client: getContextClient(),
		query,
		variables,
		requestPolicy: 'cache-and-network'
	});

	$: results = searchQueryStore?.data?.search;
	let searchText = '';
	$: filtered = search.map((s) => s.text.includes(searchText));
</script>

<Input type="text" bind:value={searchText} />
{#if filtered}
	<div class="space-y-2">
		{#each filtered as value}
			<div class="p-1 bg-slate-400">
				{JSON.stringify(value)}
			</div>
		{/each}
	</div>
{/if}
