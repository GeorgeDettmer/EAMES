<script lang="ts">
	import { TableBodyCell } from 'flowbite-svelte';
	import { createEventDispatcher } from 'svelte';

	export let pn;
	export let references: string[] = [];

	const dispatch = createEventDispatcher();
</script>

<TableBodyCell tdClass="overflow-x-auto overflow-y-auto">
	<div
		class="grid p-1 grid-flow-row auto-cols-max text-xs truncate xl:grid-cols-10 lg:grid-cols-8 md:grid-cols-3 sm:grid-cols-2"
	>
		{#each references as reference}
			{@const colour = pn ? 'blue' : 'red'}
			<span
				class={`hover:shadow m-0.5 h-4 -top-2 -right-2 rounded font-medium inline-flex items-center justify-center px-1 bg-${colour}-100 text-${colour}-800 dark:bg-${colour}-900 dark:text-${colour}-300`}
				on:mouseenter={(e) => {
					dispatch('mouseenter', e);
				}}
				on:mouseleave={(e) => {
					dispatch('mouseleave', e);
				}}
			>
				<p class="overflow-hidden text-clip hover:-text-clip">{reference}</p>
			</span>
		{/each}
	</div>
</TableBodyCell>
