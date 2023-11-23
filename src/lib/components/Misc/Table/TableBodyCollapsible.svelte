<script lang="ts">
	import { TableBodyCell } from 'flowbite-svelte';

	export let columnId: string;
	export let visible: boolean = true;
	export let collapsedColumns: string[] = [];

	export let tdClass: string | undefined = undefined;
</script>

{#if visible}
	{#if !collapsedColumns?.includes(columnId)}
		<TableBodyCell {tdClass}>
			<slot />
		</TableBodyCell>
	{:else}
		<TableBodyCell tdClass="px-0" />
	{/if}
{/if}
