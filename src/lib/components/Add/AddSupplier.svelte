<script lang="ts">
	import { queryStore, getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import {
		Label,
		Input,
		Helper,
		Select,
		Badge,
		Modal,
		Button,
		Toggle,
		Table,
		TableHeadCell,
		TableHead,
		TableBodyCell,
		TableBody,
		TableBodyRow
	} from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { messagesStore } from 'svelte-legos';
	import { datetimeFormat } from '$lib/utils';
	import UserIcon from '../UserIcon.svelte';
	const urqlClient = getContextClient();

	$: suppliersStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription suppliers {
				erp_suppliers(order_by: { name: asc }) {
					id
					name
					names
					created_at
					user_id
					user {
						username
						color
						first_name
						last_name
						id
					}
					orders_aggregate {
						aggregate {
							count
						}
					}
				}
			}
		`
	});
	$: suppliers = $suppliersStore?.data?.erp_suppliers;

	let id = '';
	let name = '';
	let identifiersInput = '';

	$: identifiers = identifiersInput ? identifiersInput.split(',')?.map((i) => i.toLowerCase()) : [];

	$: supplierIds = suppliers?.map((s) => s.id) || [];
	$: supplierIdentifiers = suppliers?.flatMap((s) => s.names) || [];
	$: suggestedId = name?.toUpperCase()?.replace(/[^A-Za-z0-9]/g, '') || '';
	$: id = suggestedId;
	$: console.log(
		'test',
		supplierIds,
		suggestedId,
		id,
		supplierIdentifiers,
		identifiers,
		identifiers.length > 0 && identifiers.every((i) => supplierIdentifiers.includes(i))
	);
	function validate(type: string) {
		if (type === 'id') {
			console.log(type, id);
			return !(id?.length > 0);
		}
	}

	let addedIds = [];
	let adding = false;
	async function add() {
		if (adding) return;
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
			return;
		}
		if (!id || !name) {
			messagesStore('Supplier id & name must be set', 'warning');
			return;
		}
		if (identifiers.length > 0 && identifiers.every((i) => supplierIdentifiers.includes(i))) {
			messagesStore(`Supplier with matching identifier (${identifiers}) already exists`, 'warning');
			return;
		}
		/* if (!$page?.data?.user?.processes['eng']) {
			alert(
				`You do not have permission to insert components. You have permission for: ${Object.keys(
					$page?.data?.user?.processes
				)}`
			);
			return;
		} */
		adding = true;
		let mutationResult;

		mutationResult = await urqlClient.mutation(
			gql`
				mutation insertSupplier($id: String!, $name: String!, $names: jsonb = []) {
					insert_erp_suppliers_one(object: { id: $id, name: $name, names: $names }) {
						id
					}
				}
			`,
			{ id: id, name, names: identifiers }
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore('Inserted supplier: ' + mutationResult.data.insert_erp_suppliers_one.id, 'success');
			id = '';
			name = '';
			identifiersInput = '';
			addedIds = [...addedIds, mutationResult.data.insert_erp_suppliers_one.id];
		}
		adding = false;
	}
</script>

<div class="w-2/3 mx-auto">
	<div class="grid md:grid-cols-2 gap-2 gap-y-1">
		<div class="flex">
			<div class="w-1/3">
				<Label>Supplier ID</Label>
				<Input placeholder={null} type="text" bind:value={id} />
				{#if supplierIds.includes(id.toUpperCase())}
					<Helper class="mt-2" color="red">
						<span class="font-medium">ID already in use!</span>
						The id {id} is already assigned to another supplier
					</Helper>
				{/if}
			</div>
			<div class="w-1/3">
				<Label>Name</Label>
				<Input placeholder={null} type="text" bind:value={name} />
			</div>
			<div class="w-1/3">
				<Label>Identifiers</Label>
				<Input type="text" bind:value={identifiersInput} on:change={() => {}} />
			</div>
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
		<Button color="blue" on:click={() => add()} disabled={adding}>Add</Button>
	</div>
</div>
<div class="pt-4 max-h-500px mx-auto">
	{#if suppliers}
		<Table>
			<TableHead>
				<TableHeadCell>#</TableHeadCell>
				<TableHeadCell>ID</TableHeadCell>
				<TableHeadCell>Name</TableHeadCell>
				<TableHeadCell>Identifiers</TableHeadCell>
				<TableHeadCell>Created at</TableHeadCell>
				<TableHeadCell>Created by</TableHeadCell>
				<TableHeadCell>Orders</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each suppliers as supplier, idx}
					<TableBodyRow
						color={addedIds.includes(supplier.id)
							? 'green'
							: supplier.id === id ||
							  supplier.name.toLowerCase() === name.toLowerCase() ||
							  !identifiers.every((i) => !supplier.names.includes(i))
							? 'red'
							: 'default'}
					>
						<TableBodyCell>{idx + 1}</TableBodyCell>
						<TableBodyCell>{supplier.id}</TableBodyCell>
						<TableBodyCell>{supplier.name}</TableBodyCell>
						<TableBodyCell>
							<div class="flex gap-x-0.5">
								{#each supplier?.names || [] as identifier}
									<div>
										<Badge color="blue">{identifier}</Badge>
									</div>
								{/each}
							</div>
						</TableBodyCell>
						<TableBodyCell>{datetimeFormat(supplier.created_at)}</TableBodyCell>
						<TableBodyCell>
							<UserIcon size="xs" user={supplier?.user}>{supplier?.user?.username || 'Unknown'}</UserIcon>
						</TableBodyCell>
						<TableBodyCell>{supplier?.orders_aggregate?.aggregate?.count}</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
			<TableHead>
				<TableHeadCell>{suppliers?.length}</TableHeadCell>
				<TableHeadCell />
				<TableHeadCell />
				<TableHeadCell />
				<TableHeadCell />
				<TableHeadCell>{suppliers?.reduce((a, v) => a + v?.orders_aggregate?.aggregate?.count || 0, 0)}</TableHeadCell>
			</TableHead>
		</Table>
	{/if}
</div>
