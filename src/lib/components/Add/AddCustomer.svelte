<script lang="ts">
	import { getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import {
		Label,
		Input,
		Helper,
		Badge,
		Button,
		Table,
		TableHeadCell,
		TableHead,
		TableBodyCell,
		TableBody,
		TableBodyRow,
		Spinner
	} from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { messagesStore } from 'svelte-legos';
	import { datetimeFormat } from '$lib/utils';
	import UserIcon from '../UserIcon.svelte';
	const urqlClient = getContextClient();

	$: customersStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription customers {
				customers(order_by: { name: asc }) {
					id
					name
					active
					created_at
					jobs_aggregate {
						aggregate {
							count
						}
					}
					user {
						id
						username
						initials
						color
						first_name
						last_name
					}
				}
			}
		`
	});
	$: customers = $customersStore?.data?.customers;

	let id = '';
	let name = '';

	$: customerNames = customers?.map((s) => s.name?.toLowerCase()) || [];

	let addedIds = [];
	let adding = false;
	async function add() {
		if (adding) return;
		try {
			if (!$page?.data?.user) {
				messagesStore('You must be logged in to perform this action', 'warning');
				return;
			}
			if (!name) {
				messagesStore('Customer name must be set', 'warning');
				return;
			}
			if (customerNames.includes(name)) {
				messagesStore(`Customer with this name (${name}) already exists`, 'warning');
				return;
			}
			adding = true;
			let mutationResult;

			mutationResult = await urqlClient.mutation(
				gql`
					mutation insertCustomer($name: String!) {
						insert_customers_one(object: { name: $name }) {
							id
						}
					}
				`,
				{ name }
			);
			if (mutationResult?.error) {
				console.error('MUTATION ERROR: ', mutationResult);
				messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
			} else {
				console.log('MUTATION RESULT: ', mutationResult);
				messagesStore('Inserted supplier: ' + mutationResult.data.insert_customers_one.id, 'success');
				id = '';
				name = '';
				addedIds = [...addedIds, mutationResult.data.insert_customers_one.id];
			}
			adding = false;
		} catch (e) {
			console.error('Add mutation failed', e);
			messagesStore('MUTATION ERROR: ' + e, 'error');
			adding = false;
		}
	}
</script>

<div class="w-2/3 mx-auto">
	<div class="grid md:grid-cols-2 gap-2 gap-y-1">
		<div class="flex">
			<!-- <div class="w-1/3">
				<Label>Supplier ID</Label>
				<Input placeholder={null} type="text" bind:value={id} />
					<Helper class="mt-2" color="red">
						<span class="font-medium">ID already in use!</span>
						The id {id} is already assigned to another supplier
					</Helper>
			</div> -->
			<div class="w-2/3">
				<Label>Name</Label>
				<Input placeholder={null} type="text" bind:value={name} />
			</div>
			<!-- <div class="w-1/3">
				<Label>Identifiers</Label>
				<Input type="text" bind:value={identifiersInput} on:change={() => {}} />
			</div> -->
		</div>
		<!-- <div class="flex">
			<div class="w-2/3" />
			<div class="">
				<Label>Quantity</Label>
				<Input placeholder={1} type="number" bind:value={quantity} />
			</div>
		</div>
		<div class="">
			<Label>Customer</Label>
			<Select items={customers} bind:value={customer} placeholder="Select customer" />
		</div>
		<div class="my-auto pt-4">
			{#if customer?.jobs_aggregate?.aggregate?.count}
				<Badge color="blue" large>{customer?.jobs_aggregate?.aggregate?.count}</Badge>
			{/if}
		</div>
		<div>
			<div class="">
				<Label>Assemblies</Label>
				{#if assemblies}
					<Select items={assemblies} bind:value={assembly} placeholder="Select assembly" />
				{:else}
					<Input type="text" />
				{/if}
			</div>
		</div>
		<div class="my-auto pt-4">
			{#if assembly}
				{#if assembly?.bom?.lines_aggregate?.aggregate?.count}
					<Badge color="blue" large>{assembly?.bom?.lines_aggregate?.aggregate?.count}</Badge>
				{/if}
			{/if}
		</div> -->
	</div>

	<!-- <div class="pt-4 mx-auto">
		<Toggle size="small" color="blue" bind:checked={createKit}>Create kit</Toggle>
	</div>-->
	<div class="pt-8">
		<Button color="blue" on:click={() => add()} disabled={adding}>
			Add
			{#if adding}
				<Spinner class="ml-3" size="3" color="white" />
			{/if}
		</Button>
	</div>
</div>
<div class="pt-4 max-h-500px mx-auto">
	{#if customers}
		<Table>
			<TableHead theadClass="text-sm uppercase text-center">
				<TableHeadCell>#</TableHeadCell>
				<TableHeadCell>ID</TableHeadCell>
				<TableHeadCell>Name</TableHeadCell>
				<TableHeadCell>Created at</TableHeadCell>
				<TableHeadCell>Created by</TableHeadCell>
				<TableHeadCell>Jobs</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each customers as customer, idx}
					<TableBodyRow
						color={addedIds.includes(customer.id)
							? 'green'
							: customer.name.toLowerCase() === name.toLowerCase()
							? 'red'
							: 'default'}
					>
						<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-sm text-center">{idx + 1}</TableBodyCell>
						<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-sm text-center">{customer.id}</TableBodyCell>
						<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-sm text-center">{customer.name}</TableBodyCell>
						<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-sm text-center">
							{datetimeFormat(customer.created_at)}
						</TableBodyCell>
						<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-sm text-center">
							<UserIcon size="xs" user={customer?.user}>{customer?.user?.username || 'Unknown'}</UserIcon>
						</TableBodyCell>
						<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-sm text-center">
							{customer?.jobs_aggregate?.aggregate?.count}
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
			<TableHead theadClass="text-sm uppercase text-center">
				<TableHeadCell>{customers?.length}</TableHeadCell>
				<TableHeadCell />
				<TableHeadCell />
				<TableHeadCell />
				<TableHeadCell />
				<TableHeadCell>{customers?.reduce((a, v) => a + v?.jobs_aggregate?.aggregate?.count || 0, 0)}</TableHeadCell>
			</TableHead>
		</Table>
	{/if}
</div>
