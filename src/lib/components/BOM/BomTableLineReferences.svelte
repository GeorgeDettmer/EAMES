<script lang="ts">
	import { TableBodyCell, Tooltip } from 'flowbite-svelte';
	import { createEventDispatcher } from 'svelte';

	export let pn;
	export let references: string[] = [];

	const dispatch = createEventDispatcher();
</script>

<TableBodyCell tdClass="overflow-x-auto overflow-y-auto">
	<div class="grid p-1 grid-flow-row text-xs xl:grid-cols-10 lg:grid-cols-8 md:grid-cols-3 sm:grid-cols-2">
		{#each references as reference}
			{@const colour = pn ? 'blue' : 'gray'}
			<span
				class={`hover:shadow m-0.5 h-4  rounded font-medium px-1 bg-${colour}-100 text-${colour}-800 dark:bg-${colour}-900 dark:text-${colour}-300`}
				on:mouseenter={(e) => {
					dispatch('mouseenter', e);
				}}
				on:mouseleave={(e) => {
					dispatch('mouseleave', e);
				}}
			>
				<p class="overflow-hidden text-clip hover:-text-clip text-center">{reference}</p>
			</span>
			<Tooltip>{reference}</Tooltip>
		{/each}
	</div>
</TableBodyCell>
