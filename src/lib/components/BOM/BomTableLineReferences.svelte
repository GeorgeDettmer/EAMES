<script lang="ts">
	import { TableBodyCell, Tooltip } from 'flowbite-svelte';
	import { createEventDispatcher } from 'svelte';

	export let pn;
	export let references: string[] = [];
	export let color: string = '';

	const dispatch = createEventDispatcher();
</script>

<!-- <TableBodyCell tdClass="overflow-x-auto overflow-y-auto"> -->
<!-- <div class="w-fit overflow-auto grid grid-flow-row text-xs xl:grid-cols-8 lg:grid-cols-6 md:grid-cols-2">
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
		<Tooltip defaultClass="py-1 px-2 text-xs font-medium">{reference}</Tooltip>
	{/each}
</div> -->
<div class="w-fit flex flex-wrap text-xs">
	{#each references as reference}
		{@const c = color ? color : pn ? 'blue' : 'gray'}
		<span
			class={`w-fit hover:shadow m-0.5 h-4  rounded font-medium px-1 bg-${c}-100 text-${c}-800 dark:bg-${c}-900 dark:text-${c}-300`}
			on:mouseenter={(e) => {
				dispatch('mouseenter', e);
			}}
			on:mouseleave={(e) => {
				dispatch('mouseleave', e);
			}}
		>
			<p class="text-clip hover:-text-clip text-center">{reference}</p>
		</span>
		<Tooltip defaultClass="py-1 px-2 text-xs font-medium">{reference}</Tooltip>
	{/each}
</div>
<!-- </TableBodyCell> -->
