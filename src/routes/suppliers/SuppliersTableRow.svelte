<script lang="ts">
	import SupplierTags from '$lib/components/Supplier/SupplierTags.svelte';
	import UserIcon from '$lib/components/UserIcon.svelte';
	import type { Supplier } from '$lib/types';
	import { classes, datetimeFormat } from '$lib/utils';
	import { Tooltip } from 'flowbite-svelte';
	import { TableBodyRow, TableBodyCell, Badge } from 'flowbite-svelte';
	import moment from 'moment';

	export let supplier: Supplier;
	export let idx: number | null = null;
</script>

<TableBodyRow color={supplier?.approved ? 'default' : 'yellow'}>
	<slot name="start" />
	<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-medium">
		{supplier.id}
	</TableBodyCell>
	<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-medium">
		{supplier.name}
	</TableBodyCell>
	<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-medium">
		{supplier?.critical ? 'Critical' : 'Non-Critical'}
	</TableBodyCell>
	<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-medium">
		<div class="flex gap-x-1 align-middle">
			<p class={supplier?.userByApprovedUserId ? classes.popover : ''}>{supplier?.approved ? 'Approved' : 'Unapproved'}</p>
			{#if supplier?.approved}
				<Tooltip placement="right" defaultClass="py-1 px-2 text-xs">
					<div class="flex gap-x-1">
						<UserIcon size="xs" user={supplier?.userByApprovedUserId}>
							{supplier?.userByApprovedUserId?.first_name || 'Unknown'}
							{supplier?.userByApprovedUserId?.last_name || ''}
						</UserIcon>
					</div>
				</Tooltip>
			{/if}
		</div>
	</TableBodyCell>
	<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-medium">
		<div class="flex flex-wrap gap-x-0.5">
			{#each supplier?.names || [] as identifier}
				<div>
					<Badge color="blue">{identifier}</Badge>
				</div>
			{/each}
		</div>
	</TableBodyCell>
	<TableBodyCell tdClass="px-1 py-1">
		<Badge
			color={!supplier?.risk_level
				? 'dark'
				: supplier?.risk_level === 'HIGH'
				? 'red'
				: supplier?.risk_level === 'MEDIUM'
				? 'yellow'
				: 'blue'}
		>
			{supplier?.risk_level || 'Undefined'}
		</Badge>
	</TableBodyCell>
	<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-medium">
		<div class="space-y-0.5 text-xs">
			<SupplierTags tags={supplier?.categories || []} />
		</div>
	</TableBodyCell>
	<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-medium">
		<div class="flex flex-wrap gap-x-0.5 text-xs">
			<SupplierTags tags={supplier?.tags || []} />
		</div>
	</TableBodyCell>
	<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-medium">
		{datetimeFormat(supplier.created_at)}
	</TableBodyCell>
	<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-medium">
		<UserIcon size="xs" user={supplier?.user}>{supplier?.user?.username || 'Unknown'}</UserIcon>
		<Tooltip placement="left">
			{supplier?.user?.first_name || 'Unknown'}
			{supplier?.user?.last_name || ''}
		</Tooltip>
	</TableBodyCell>
	{@const lastUsed = supplier?.orders_aggregate?.aggregate?.max?.created_at}
	{@const daysSinceLastUsed = (Date.now() - new Date(lastUsed || supplier?.created_at).getTime()) / 1000 / 60 / 60 / 24}
	<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-medium">
		<Badge color={daysSinceLastUsed > 180 || !lastUsed ? 'red' : daysSinceLastUsed > 90 ? 'yellow' : 'blue'}>
			<div class="text-xs -space-y-1">
				{#if lastUsed}
					<p>{datetimeFormat(lastUsed, false)}</p>
					<p class="italic text-right">
						{moment(lastUsed).fromNow().startsWith('in') ? 'moments ago' : moment(lastUsed).fromNow()}
					</p>
				{:else}
					Never
				{/if}
			</div>
		</Badge>
	</TableBodyCell>
	<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-medium">
		{supplier?.orders_aggregate?.aggregate?.count}
	</TableBodyCell>
	<slot name="end" />
</TableBodyRow>
