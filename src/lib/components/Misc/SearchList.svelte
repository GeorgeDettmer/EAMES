<script lang="ts">
	import { Input } from 'flowbite-svelte';

	interface Serachable {
		text: string;
		value: any;
	}
	export let search: Serachable[];

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
