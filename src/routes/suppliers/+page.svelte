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
	import EditToggle from '$lib/components/Misc/EditToggle.svelte';
	import SupplierTags from '$lib/components/Supplier/SupplierTags.svelte';

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
					tags
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
	$: console.log('suppliers', suppliers, suppliersOriginal);

	$: supplierIdentifiers = suppliers?.flatMap((s) => s.names) || [];

	let suppliersOriginal = [];
	let newSuppliers = [];
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

	interface Supplier {
		id: string;
		name: string;
		names: string[];
	}
	let updating;
	async function update(id: string, updates: Supplier) {
		if (updating) return;
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
			return;
		}
		if (!id) {
			messagesStore('Supplier id must be provided for update', 'warning');
			return;
		}

		let identifiers = updates?.names || [];
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
		updating = true;
		let mutationResult;

		mutationResult = await urqlClient.mutation(
			gql`
				mutation updateSupplier($id: String, $_set: erp_suppliers_set_input = {}) {
					update_erp_suppliers_by_pk(pk_columns: { id: $id: }, _set: $_set) {
						name
						names
						updated_at
					}
				}
			`,
			{ _set: updates }
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore('Updated supplier: ' + mutationResult.data.update_erp_suppliers_by_pk.id, 'success');
		}
		updating = false;
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
				<TableHeadCell>Tags</TableHeadCell>
				<TableHeadCell>Created at</TableHeadCell>
				<TableHeadCell>Created by</TableHeadCell>
				<TableHeadCell>Orders</TableHeadCell>
				<TableHeadCell />
			</TableHead>
			<TableBody>
				{#each [...suppliers, ...newSuppliers] as supplier, idx}
					<TableBodyRow>
						<TableBodyCell tdClass="px-6 py-1">
							<p class="cursor-default">{idx + 1}</p>
						</TableBodyCell>
						<TableBodyCell tdClass="px-6 py-1">
							{#if supplier.__edit}
								<span
									contenteditable="true"
									bind:innerText={supplier.id}
									on:keydown={(e) => {
										if (e.key === 'Enter') {
											e.target?.blur();
											e.preventDefault();
										}
									}}
									on:blur={() => {
										console.log('change', supplier.id);
									}}
								/>
							{:else}
								{supplier.id}
							{/if}
						</TableBodyCell>
						<TableBodyCell tdClass="px-6 py-1">
							{#if supplier.__edit}
								<span
									contenteditable="true"
									bind:innerText={supplier.name}
									on:keydown={(e) => {
										if (e.key === 'Enter') {
											e.target?.blur();
											e.preventDefault();
										}
									}}
									on:blur={() => {
										console.log('change', supplier.name);
									}}
								/>
							{:else}
								{supplier.name}
							{/if}
						</TableBodyCell>
						<TableBodyCell clickToEdit={false} bind:editing={supplier.__edit} tdClass="px-6 py-1">
							<div class="flex gap-x-0.5">
								{#each supplier?.names || [] as identifier}
									<div>
										<Badge color="blue">{identifier}</Badge>
									</div>
								{/each}
							</div>
						</TableBodyCell>
						<TableBodyCell clickToEdit={false} bind:editing={supplier.__edit} tdClass="px-6 py-1">
							<div class="flex gap-x-0.5">
								<!-- {#each supplier?.tags || [] as tag}
									<div>
										<Badge color="blue">{tag}</Badge>
									</div>
								{/each} -->
								<SupplierTags tags={supplier?.tags} />
							</div>
						</TableBodyCell>
						<TableBodyCell tdClass="px-6 py-1">
							{datetimeFormat(supplier.created_at)}
						</TableBodyCell>
						<TableBodyCell tdClass="px-6 py-1">
							<UserIcon size="xs" user={supplier?.user}
								>{supplier?.user?.first_name || 'Unknown'} {supplier?.user?.last_name || 'Unknown'}</UserIcon
							>
						</TableBodyCell>
						<TableBodyCell tdClass="px-6 py-1">{supplier?.orders_aggregate?.aggregate?.count}</TableBodyCell>
						<TableBodyCell tdClass="px-6 py-1">
							<EditToggle
								bind:editing={supplier.__edit}
								on:click={() => {
									console.log('click');
									suppliersOriginal[idx] = { ...supplier };
									supplier.__edit = !supplier?.__edit;
								}}
								on:dispose={() => {
									console.log('dispose changes');
									supplier.__edit = false;
									suppliers[idx] = suppliersOriginal[idx];
									suppliersOriginal[idx] = undefined;
								}}
								on:save={() => {
									console.log('save');
									supplier.__edit = false;
								}}
							/>
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
			<TableHead>
				<TableHeadCell>{suppliers?.length + newSuppliers?.length}</TableHeadCell>
				<TableHeadCell />
				<TableHeadCell />
				<TableHeadCell />
				<TableHeadCell />
				<TableHeadCell />
				<TableHeadCell />
				<TableHeadCell>{suppliers?.reduce((a, v) => a + v?.orders_aggregate?.aggregate?.count || 0, 0)}</TableHeadCell>
				<TableHeadCell>
					<!-- <span
						on:click={() => {
							newSuppliers = [
								...newSuppliers,
								{
									id: '',
									name: '',
									names: [],
									created_at: new Date(),
									user_id: $page?.data?.user?.id,
									user: $page?.data?.user,
									__edit: true
								}
							];
						}}
					>
						<Plus size="24" class="hover:text-green-600 cursor-pointer" />
					</span> -->
				</TableHeadCell>
			</TableHead>
		</Table>
	{/if}
</div>
