<script lang="ts">
	import { classes, numberToLetter, datetimeFormat } from '$lib/utils';
	import { TableBodyRow, TableBodyCell, Badge, Popover, Tooltip } from 'flowbite-svelte';
	import moment from 'moment';

	export let job;
	export let jobPrefix: string = '';
</script>

<TableBodyRow color={job?.batch > 0 ? 'default' : 'default'}>
	<slot name="start" />

	<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-medium">
		<div class="flex gap-x-1">
			<p class="italic text-gray-500">{jobPrefix || ''}</p>
			<a href={`job/${job?.id}`} class={classes.link}>
				{job?.id}
			</a>
		</div>
	</TableBodyCell>
	<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-medium" columnId="batch">
		{#if job?.batch > 0}
			<Badge color="blue">
				{numberToLetter(job.batch - 1)}
			</Badge>
		{:else}
			<!-- <Badge color="dark">N/A</Badge> -->
		{/if}
	</TableBodyCell>
	<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-medium" columnId="customer">
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<button
			on:click={(e) => {
				/* supplierSearch = supplierSearch ? '' : job?.supplier?.id;
                replaceStateWithQuery({
                    supplier: supplierSearch
                }); */
			}}
		>
			<Badge color="blue">
				{job.customer?.name}
			</Badge>
		</button>
	</TableBodyCell>
	<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-medium" columnId="customer">
		{job?.reference || ''}
	</TableBodyCell>
	<TableBodyCell tdClass="px-1 py-1 max-w-48 whitespace-nowrap font-medium" columnId="quantity">
		{job?.quantity || 0}
	</TableBodyCell>
	<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-medium" columnId="assembly">
		<button
			on:click={(e) => {
				/* supplierSearch = supplierSearch ? '' : job?.supplier?.id;
                replaceStateWithQuery({
                    supplier: supplierSearch
                }); */
			}}
		>
			<Badge border={!job?.assembly?.name} color={!job?.assembly?.name ? 'red' : 'blue'}>
				<p>
					<span class={classes.popover}>{job?.assembly?.name}</span>
					<span>| {job?.assembly?.revision_external}</span>
				</p>
			</Badge>
		</button>
		<Popover placement="left">
			<p>Assembly info...</p>
		</Popover>
		{#if job?.supplier?.approved === false}
			<Badge color="red" rounded>
				<p class="text-xs font-bold uppercase">!</p>
			</Badge>
			<Tooltip defaultClass="py-1 px-2 text-sm font-medium" placement="right">Unapproved Supplier</Tooltip>
		{/if}
	</TableBodyCell>
	<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-medium" columnId="duedate">
		{@const daysUntilDue = (Date.now() - new Date(job?.due_date).getTime()) / 1000 / 60 / 60 / 24}
		<Badge color={daysUntilDue < 2 ? 'red' : daysUntilDue < 5 ? 'yellow' : 'blue'}>
			<div class="text-xs -space-y-1">
				{#if job?.due_date}
					<p>{datetimeFormat(job?.due_date, false)}</p>
					<p class="italic text-right">
						{moment(job?.due_date).fromNow()}
					</p>
				{:else}
					N/A
				{/if}
			</div>
		</Badge>
	</TableBodyCell>
	<slot name="end" />
</TableBodyRow>
