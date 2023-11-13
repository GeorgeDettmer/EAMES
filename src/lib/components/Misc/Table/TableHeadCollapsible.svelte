<script lang="ts">
	import { TableHeadCell } from 'flowbite-svelte';
	import { ChevronDownOutline, ChevronLeftOutline } from 'flowbite-svelte-icons';

	export let columnId: string;
	export let visible: boolean = true;
	export let collapsedColumns: string[] = [];

	function collapseColumn(columnId: string, collapse: boolean) {
		if (collapse) {
			collapsedColumns = [...collapsedColumns, columnId];
		} else {
			collapsedColumns = collapsedColumns.filter((c) => c != columnId);
		}
	}
</script>

{#if visible}
	{#if !collapsedColumns?.includes(columnId)}
		<TableHeadCell>
			<div class="inline-flex cursor-pointer">
				<slot />
				<div class="my-auto ml-1">
					<ChevronDownOutline size="xs" on:click={() => collapseColumn(columnId, true)} />
				</div>
			</div>
		</TableHeadCell>
	{:else}
		<TableHeadCell padding="px-0">
			<div class="inline-flex cursor-pointer">
				<div class="my-auto ml-1">
					<ChevronLeftOutline size="xs" on:click={() => collapseColumn(columnId, false)} />
				</div>
			</div>
		</TableHeadCell>
	{/if}
{/if}
