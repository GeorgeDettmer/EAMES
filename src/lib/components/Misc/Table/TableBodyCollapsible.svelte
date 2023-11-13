<script lang="ts">
	import { TableBodyCell } from 'flowbite-svelte';

	export let columnId: string;
	export let visible: boolean = true;
	export let collapsedColumns: string[] = [];
</script>

{#if visible}
	{#if !collapsedColumns?.includes(columnId)}
		<TableBodyCell>
			<slot />
		</TableBodyCell>
	{:else}
		<TableBodyCell tdClass="px-0" />
	{/if}
{/if}
