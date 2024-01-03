<script lang="ts">
	import { TableHeadCell, Tooltip } from 'flowbite-svelte';
	import { ChevronDownOutline, ChevronLeftOutline } from 'flowbite-svelte-icons';

	export let padding: string = 'px-6 py-3';
	export let columnId: string;
	export let visible: boolean = true;
	export let collapsedColumns: string[] = [];
	export let showCollapseButton: boolean = true;

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
		<TableHeadCell {padding}>
			<div class="inline-flex cursor-pointer">
				<slot />
				{#if showCollapseButton}
					<div class="my-auto ml-1">
						<ChevronDownOutline size="xs" on:click={() => collapseColumn(columnId, true)} />
					</div>
				{/if}
			</div>
		</TableHeadCell>
	{:else}
		<TableHeadCell padding="px-0">
			{#if showCollapseButton}
				<div class="inline-flex cursor-pointer">
					<div class="my-auto ml-1">
						<ChevronLeftOutline size="xs" on:click={() => collapseColumn(columnId, false)} />
					</div>
				</div>
				<Tooltip placement="right" defaultClass="py-2 px-2 text-xs font-medium"><slot /></Tooltip>
			{/if}
		</TableHeadCell>
	{/if}
{/if}
