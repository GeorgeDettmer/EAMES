<script lang="ts">
	import { getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import { Table, TableHeadCell, TableHead, TableBodyCell, TableBody, TableBodyRow, Badge } from 'flowbite-svelte';
	import { datetimeFormat } from '$lib/utils';
	import UserIcon from '$lib/components/UserIcon.svelte';
	import { onMount } from 'svelte';
	import { windowTitleStore } from '$lib/stores';
	import { Check, Plus } from 'svelte-heros-v2';
	import { page } from '$app/stores';
	import { messagesStore } from 'svelte-legos';
	import TableBodyCellEditable from '$lib/components/Misc/Table/TableBodyCellEditable.svelte';
	import { EditOutline } from 'flowbite-svelte-icons';

	onMount(() => {
		$windowTitleStore = 'Suppliers';
		return () => {
			$windowTitleStore = '';
		};
	});

	$: suppliersStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription suppliers {
				erp_suppliers(order_by: { name: asc }) {
					id
					name
					names
					created_at
					user {
						username
						color
						first_name
						last_name
						initials
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

	$: supplierIds = suppliers?.map((s) => s.id) || [];
	$: suggestedId = name?.toUpperCase()?.replace(/[^A-Za-z0-9]/g, '') || '';
	$: id = suggestedId;
	$: console.log('test', supplierIds, suggestedId, id);

	$: supplierIdentifiers = suppliers?.flatMap((s) => s.names) || [];

	let newSupplier = null;
	let addedIds: string[] = [];
	let adding = false;
	const urqlClient = getContextClient();
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
		let identifiers = newSupplier?.names || [];
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
			newSupplier = null;
			addedIds = [...addedIds, mutationResult.data.insert_erp_suppliers_one.id];
		}
		adding = false;
	}
</script>

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
				<TableHeadCell />
			</TableHead>
			<TableBody>
				{#each suppliers as supplier, idx (supplier.id)}
					<TableBodyRow>
						<TableBodyCellEditable clickToEdit={false} tdClass="px-6 py-1">
							{idx + 1}
						</TableBodyCellEditable>
						<TableBodyCellEditable
							inputType="text"
							clickToEdit={false}
							bind:value={supplier.id}
							bind:editing={supplier.__edit}
							tdClass="px-6 py-1"
						>
							{supplier.id}
						</TableBodyCellEditable>
						<TableBodyCellEditable
							inputType="text"
							clickToEdit={false}
							bind:value={supplier.name}
							bind:editing={supplier.__edit}
							tdClass="px-6 py-1"
						>
							{supplier.name}
						</TableBodyCellEditable>
						<TableBodyCell clickToEdit={false} bind:editing={supplier.__edit} tdClass="px-6 py-1">
							<div class="flex gap-x-0.5">
								{#each supplier?.names || [] as identifier}
									<div>
										<Badge color="blue">{identifier}</Badge>
									</div>
								{/each}
							</div>
						</TableBodyCell>
						<TableBodyCell tdClass="px-6 py-1">
							{datetimeFormat(supplier.created_at)}
						</TableBodyCell>
						<TableBodyCell tdClass="px-6 py-1">
							<UserIcon size="xs" user={supplier?.user}>{supplier?.user?.username || 'Unknown'}</UserIcon>
						</TableBodyCell>
						<TableBodyCell tdClass="px-6 py-1">{supplier?.orders_aggregate?.aggregate?.count}</TableBodyCell>
						<TableBodyCell tdClass="px-6 py-1">
							<span
								on:click={() => {
									supplier.__edit = !supplier?.__edit;
								}}
							>
								{#if supplier.__edit}
									<Check />
								{:else}
									<EditOutline size="sm" />
								{/if}
							</span>
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
			<TableHead>
				<TableHeadCell>{suppliers?.length}</TableHeadCell>
				<TableHeadCell />
				<TableHeadCell />
				<TableHeadCell />
				<TableHeadCell />
				<TableHeadCell />
				<TableHeadCell>{suppliers?.reduce((a, v) => a + v?.orders_aggregate?.aggregate?.count || 0, 0)}</TableHeadCell>
				<TableHeadCell>
					<span
						on:click={() => {
							newSupplier = {
								id: '',
								name: '',
								names: [],
								created_at: new Date(),
								user_id: $page?.data?.user?.id,
								user: $page?.data?.user
							};
						}}
					>
						<Plus size="24" class="hover:text-green-600 cursor-pointer" />
					</span>
				</TableHeadCell>
			</TableHead>
		</Table>
	{/if}
</div>
