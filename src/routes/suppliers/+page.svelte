<script lang="ts">
	import { getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import { Table, TableHeadCell, TableHead, TableBodyCell, TableBody, TableBodyRow, Badge } from 'flowbite-svelte';
	import { datetimeFormat } from '$lib/utils';
	import UserIcon from '$lib/components/UserIcon.svelte';
	import { onMount } from 'svelte';
	import { windowTitleStore } from '$lib/stores';

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
			</TableHead>
			<TableBody>
				{#each suppliers as supplier, idx}
					<TableBodyRow>
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
				<TableHeadCell />
				<TableHeadCell>{suppliers?.reduce((a, v) => a + v?.orders_aggregate?.aggregate?.count || 0, 0)}</TableHeadCell>
			</TableHead>
		</Table>
	{/if}
</div>
