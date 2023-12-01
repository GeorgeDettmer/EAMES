<script lang="ts">
	export let data;
	import { page } from '$app/stores';
	import PartInfo from '$lib/components/PartInfo.svelte';
	import { getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
	import { slide } from 'svelte/transition';

	$: kitItemIds = $page?.data?.itemIds?.split(',') || [];

	$: kitItemInfoStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription kitItemsInfo($kitItemIds: [Int] = []) {
				erp_kits_items(where: { id: { _in: $kitItemIds } }) {
					id
					quantity
					created_at
					updated_at
					user {
						id
						username
						initials
						first_name
						last_name
						color
					}
					kit {
						id
						jobs_kits {
							job_id
						}
					}
					orders_item {
						id
						created_at
						order {
							id
							supplier {
								id
								name
							}
						}
						part
						partByPartId {
							id
							name
							description
							images
						}
					}
					items_consumeds {
						id
						part
						quantity
						updated_at
						user {
							id
							username
							first_name
							last_name
							initials
							color
						}
					}
				}
			}
		`,
		variables: { kitItemIds }
	});
	$: kitItemsInfo = $kitItemInfoStore?.data?.erp_kits_items;
</script>

{#if $kitItemInfoStore.error}
	<p>Error: {$kitItemInfoStore.error.name}</p>
	<pre>{JSON.stringify($kitItemInfoStore.error, null, 2)}</pre>
{:else if !$kitItemInfoStore.data}
	<p>Loading...</p>
{:else if kitItemsInfo}
	{#each kitItemsInfo as kitItem}
		<pre>{JSON.stringify(kitItem, null, 2)}</pre>
	{/each}
{/if}
