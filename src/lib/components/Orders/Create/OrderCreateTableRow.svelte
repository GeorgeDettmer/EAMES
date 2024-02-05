<script lang="ts">
	import { page } from '$app/stores';
	import EditableText from '$lib/components/Misc/EditableText.svelte';
	import TableBodyCellEditable from '$lib/components/Misc/Table/TableBodyCellEditable.svelte';
	import UserIcon from '$lib/components/UserIcon.svelte';
	import { datetimeFormat, numberToLetter } from '$lib/utils';
	import { TableBodyRow, TableBodyCell, Tooltip, Badge } from 'flowbite-svelte';
	import { createEventDispatcher } from 'svelte';
	import { XMark } from 'svelte-heros-v2';

	interface Category {
		id: string | null;
		text?: string;
	}

	export let item = {};
	export let idx: number;
	export let allocatableJobs: any[] = [];
	export let allocatabledShipments: any[] = [];
	export let categories: Array<Category> = [
		{ id: null, text: 'Unknown' },
		{ id: 'Component' },
		{ id: 'Tooling' },
		{ id: 'PCB' },
		{ id: 'Consumables' },
		{ id: 'Other' }
	];

	const dispatch = createEventDispatcher();

	$: unallocatedTo = allocatableJobs?.filter(
		(j) => item.jobs_allocations.findIndex((a) => a?.job_id === j?.id && a?.job_batch === j?.batch) === -1
	);
	$: unallocatedQty = item?.quantity - item.jobs_allocations.reduce((a, q) => a + (Number(q?.quantity) || item.quantity), 0);

	let selectAllocationJobVisible = false;
	let allocationJobSelection = -1;
</script>

<TableBodyRow class="p-0 object-right">
	<TableBodyCell tdClass="px-6 py-1">
		{idx + 1}
	</TableBodyCell>
	<TableBodyCell tdClass="px-6 py-1">
		<UserIcon size="xs" user={item?.user || $page?.data?.user}>
			{item?.user?.first_name || $page?.data?.user?.first_name}
			{item?.user?.last_name || $page?.data?.user?.last_name}
		</UserIcon>
		<Tooltip placement="right">
			<p>{datetimeFormat(item.created_at)}</p>
		</Tooltip>
	</TableBodyCell>
	<TableBodyCellEditable
		tdClass="px-6 py-1 cursor-pointer"
		bind:value={item.category}
		inputType="dropdown"
		options={categories}
	>
		{item?.category || 'Unknown'}
	</TableBodyCellEditable>
	<TableBodyCell tdClass="px-6 py-1">
		<div>
			<EditableText bind:innerText={item.part} />
			{#if item?.spn}
				<EditableText classes="text-xs italic" bind:innerText={item.spn} />
			{/if}
		</div>
	</TableBodyCell>
	<TableBodyCellEditable tdClass="px-6 py-1 cursor-pointer" bind:value={item.quantity} inputType="number">
		<Badge class="mx-0.5" color={'blue'}>
			{item?.quantity}
		</Badge>
	</TableBodyCellEditable>
	<TableBodyCell tdClass="px-6 py-1 cursor-pointer">
		<div class="flex">
			<div>
				{#each item?.jobs_allocations as allocation, idx}
					<div class="py-0.5 mx-auto">
						<div class="flex w-fit rounded bg-slate-500">
							<Badge color="blue">
								<p class="text-left">
									{allocation?.job_id}
									{#if allocation?.job_batch}
										({numberToLetter(allocation.job_batch - 1)})
									{/if}
								</p>
								<button
									class="focus:outline-none pl-1"
									on:click={() => {
										console.log('dismiss', idx, item.jobs_allocations);
										item.jobs_allocations = item.jobs_allocations.filter((v, i) => i !== idx);
									}}
								>
									<XMark size="16" class="outline-none" />
								</button>
							</Badge>

							<EditableText
								classes="text-xs my-auto text-center font-semibold p-1 cursor-default min-w-8 text-white"
								bind:innerText={allocation.quantity}>{item.quantity}</EditableText
							>
						</div>
					</div>
				{:else}
					<div class="flex my-auto">
						<Badge color="dark">
							<p class="font-semibold uppercase text-xs">No allocation</p>
						</Badge>
					</div>
				{/each}
				{#if unallocatedQty > 0}
					<div class="py-0.5 mx-auto">
						<div class="flex w-fit rounded bg-slate-500">
							<Badge color="blue">
								<p class="text-left">N/A</p>
							</Badge>

							<p class="text-xs my-auto text-center font-semibold p-1 cursor-default min-w-8 text-white">{unallocatedQty}</p>
						</div>
					</div>
				{/if}
				{#if selectAllocationJobVisible}
					<select
						class="w-fit block text-sm disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded px-0.5 py-0.5"
						bind:value={allocationJobSelection}
						on:change={() => {
							console.log('change', item.jobs_allocations, allocationJobSelection);
							if (allocationJobSelection < 0) return;
							selectAllocationJobVisible = false;
							let job = unallocatedTo?.[allocationJobSelection];
							if (!job) {
								console.error('No job to allocate to');
								return;
							}
							console.log('new allocation', job, item?.jobs_allocations, unallocatedQty);
							item.jobs_allocations = [
								...item.jobs_allocations,
								{ job_id: job?.id, job_batch: job?.batch, quantity: unallocatedQty }
							];
							allocationJobSelection = null;
						}}
					>
						<option value={null} />
						{#each unallocatedTo as job, i}
							<option value={i}>
								{job.id}
								{#if job.batch > 0}
									({String.fromCharCode(64 + job.batch)})
								{/if}
							</option>
						{/each}
					</select>
				{/if}
			</div>
			<div class="px-0.5 mt-auto">
				{#if !selectAllocationJobVisible}
					<button
						class="hover:text-green-600 text-2xl disabled:cursor-not-allowed disabled:text-gray-500"
						disabled={unallocatedQty < 1 || unallocatedTo.length < 1}
						on:click={() => {
							selectAllocationJobVisible = true;
						}}
					>
						+
					</button>
				{:else}
					<button
						class="hover:text-orange-600 text-lg disabled:cursor-not-allowed disabled:text-gray-500"
						on:click={() => {
							selectAllocationJobVisible = false;
						}}
					>
						X
					</button>
				{/if}
			</div>
		</div>
	</TableBodyCell>
	<TableBodyCellEditable tdClass="px-6 py-1 cursor-pointer" bind:value={item.price} inputType="number">
		{new Intl.NumberFormat('en-GB', {
			style: 'currency',
			currency: 'GBP'
		}).format(item?.price || 0)}
	</TableBodyCellEditable>
	<TableBodyCell tdClass="px-6 py-1">
		{new Intl.NumberFormat('en-GB', {
			style: 'currency',
			currency: 'GBP'
		}).format(Math.round((item?.price * item?.quantity + Number.EPSILON) * 100) / 100 || 0)}
	</TableBodyCell>
	<TableBodyCell tdClass="px-6 py-1">
		<div>
			<select
				class="block w-fit text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
				bind:value={item.__shipmentIdx}
			>
				{#each allocatabledShipments as shipment, idx}
					<option value={idx}>
						{idx + 1}) {shipment?.carrier?.name || 'Unknown'}
					</option>
				{/each}
			</select>
		</div>
	</TableBodyCell>
	<TableBodyCell tdClass="px-6 py-1">
		<span
			class="cursor-pointer"
			on:click={() => {
				dispatch('remove', { item, idx });
			}}
		>
			❌
		</span>
	</TableBodyCell>
	<slot name="body" />
</TableBodyRow>
