<script lang="ts">
	import { page } from '$app/stores';
	import { getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import { scanStore } from '$lib/stores';
	import { messagesStore } from 'svelte-legos';
	import { ChevronDoubleDown, ChevronDoubleUp } from 'svelte-heros-v2';
	import KitList from '$lib/components/Kitting/KitList.svelte';
	import BomTableKitting from '$lib/components/BOM/BomTableKitting.svelte';
	import { Alert, Spinner, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
	import { goto } from '$app/navigation';

	$: kittingStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription recentKitActivityJobs($offset: Int = 0) {
				jobs(
					limit: 1000
					offset: $offset
					where: { jobs_kits_aggregate: { count: { predicate: { _gt: 0 } } } }
					order_by: { jobs_kits2: { kit: { updated_at: desc_nulls_last } } }
				) {
					id
					quantity
					customer {
						name
					}
					jobs_kits {
						kit {
							id
							updated_at
						}
						id
						kit_id
					}
				}
			}
		`,
		variables: { offset: 0 }
	});
	$: recentKitActivityJobs = $kittingStore?.data?.jobs;

	$: console.log('scanStore', $scanStore);
</script>

{#if $kittingStore.data}
	{#if recentKitActivityJobs}
		<div class="flex" />
	{/if}

	<Table hoverable>
		<TableHead>
			<TableHeadCell>#</TableHeadCell>
			<TableHeadCell>Job#</TableHeadCell>
			<TableHeadCell>Customer</TableHeadCell>
			<TableHeadCell>Kits</TableHeadCell>
		</TableHead>
		<TableBody>
			{#each recentKitActivityJobs as job, idx}
				<TableBodyRow
					class={`cursor-pointer`}
					on:click={() => {
						goto('/kitting/' + job.id);
					}}
				>
					<TableBodyCell>
						{idx + 1}
					</TableBodyCell>
					<TableBodyCell>
						{job.id}
					</TableBodyCell>
					<TableBodyCell>
						{job.customer.name}
					</TableBodyCell>
					<TableBodyCell>
						{job.jobs_kits.length}
					</TableBodyCell>
				</TableBodyRow>
			{:else}
				<TableBodyRow>
					<TableBodyCell colspan="4">No jobs with recent kitting activity...</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
{:else}
	<Spinner color="blue" />
{/if}
