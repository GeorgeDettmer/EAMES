<script lang="ts">
	import { getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import { Modal } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { windowTitleStore } from '$lib/stores';
	import { page } from '$app/stores';
	import { messagesStore, storage } from 'svelte-legos';
	import EditModal from '../EditModal.svelte';
	import SuppliersTable from '../SuppliersTable.svelte';
	import type { Supplier } from '$lib/types';
	import { writable } from 'svelte/store';

	onMount(() => {
		$windowTitleStore = 'Suppliers';
		return () => {
			$windowTitleStore = '';
		};
	});

	let showHiddenSuppliers = storage(writable(false), 'EAMES_suppliers_showHiddenSuppliers');
	$: suppliersStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription suppliers($where: erp_suppliers_bool_exp = {}) {
				erp_suppliers(order_by: { name: asc }, where: $where) {
					id
					name
					names
					created_at
					risk_level
					tags
					approved
					critical
					categories
					contacts
					addresses
					hidden
					user {
						username
						color
						first_name
						last_name
						initials
						id
					}
					userByApprovedUserId {
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
							max {
								created_at
							}
							min {
								created_at
							}
						}
					}
				}
			}
		`,
		variables: {
			where: {
				hidden: $showHiddenSuppliers ? {} : { _eq: false }
			}
		}
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

	let editModal = false;
	let editSupplier: Supplier | undefined;
</script>

<div class="pt-4 max-h-500px mx-auto">
	{#if suppliers}
		<SuppliersTable {suppliers} allowEdit={false} bind:showHiddenSuppliers={$showHiddenSuppliers} />
	{/if}
</div>

<Modal
	bind:open={editModal}
	on:on:close={() => {
		console.log('close');
		editSupplier = undefined;
	}}
>
	<EditModal {editSupplier} />
</Modal>
