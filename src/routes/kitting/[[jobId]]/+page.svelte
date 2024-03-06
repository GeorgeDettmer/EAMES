<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	import { page } from '$app/stores';
	import { getContextClient, gql, queryStore, subscriptionStore } from '@urql/svelte';
	import JobOverview from '$lib/components/Job/JobOverview.svelte';
	import { scanStore, windowTitleStore } from '$lib/stores';
	import BomTableKitting from '$lib/components/BOM/BomTableKitting.svelte';
	import { Alert, Spinner } from 'flowbite-svelte';
	import KittingDashboard from '$lib/components/Kitting/KittingDashboard.svelte';
	import { onMount } from 'svelte';
	import { numberToLetter } from '$lib/utils';

	onMount(() => {
		return () => {
			$windowTitleStore = '';
		};
	});
	$: $windowTitleStore = $page?.data?.jobId ? `Kitting | ${$page?.data?.jobId}` : 'Kitting';
	$: jobId = $page?.data?.jobId;
	$: batchId = $page?.data?.batchId || 0;
	let selectedBatches = [$page?.data?.batchId || 0];

	let query = gql`
		subscription jobInfo($jobId: bigint!) {
			jobs(where: { id: { _eq: $jobId } }, order_by: { batch: asc }) {
				id
				quantity
				batch
				customer {
					name
				}
				assembly {
					id
					name
					revision_external
					revision_internal
					bom {
						id
						name
						revision_external
						revision_internal
						lines_aggregate {
							aggregate {
								count
							}
						}
						lines(order_by: { reference: asc_nulls_last }) {
							id
							reference
							part
							description
							created_at
							updated_at
							quantity
							partByPart {
								id
								name
								description
								manufacturer
								polarised
								properties
								created_at
								footprint
								image_url
								images
								kb
								updated_at
							}
						}
					}
					assemblies_cad {
						id
						name
					}
				}
				jobs_kits {
					job_id
					job_batch
					kit {
						id
						created_at
						kits_items {
							id
							kit_id
							quantity
							part
							part_id
							created_at
							updated_at
							user {
								id
								username
								first_name
								last_name
								initials
								color
							}
							orders_item {
								id
								price
								quantity
								order {
									id
									reference
									supplier {
										name
									}
								}
							}
						}
					}
				}
				jobs_allocations {
					id
					job_id
					job_batch
					order_item_id
					stock_item_id
					quantity
					orders_item {
						id
						created_at
						updated_at
						tracking
						order {
							id
							reference
							supplier {
								id
								name
							}
						}
						part
						part_id
						partByPartId {
							description
							name
						}
						price
						quantity
						user {
							id
							username
							first_name
							last_name
							initials
							color
						}
						orders_items_receiveds {
							id
							quantity
							created_at
							updated_at
							user {
								id
								username
								first_name
								last_name
								initials
								color
							}
							orders_item {
								id
								price
								quantity
								order {
									id
									reference
									supplier {
										name
									}
								}
							}
						}
					}
				}
			}
		}
	`;
	$: jobInfoStore = subscriptionStore({
		client: getContextClient(),
		query,
		variables: { jobId }
	});
	$: jobInfo = $jobInfoStore?.data?.jobs?.find((j) => j.batch === selectedBatches[0]) || {};
	$: allocations =
		$jobInfoStore?.data?.jobs
			?.filter((a) => a.batch === 0 || selectedBatches.includes(a.batch))
			?.flatMap((j) => j.jobs_allocations) || [];
	$: jobs_kits =
		$jobInfoStore?.data?.jobs
			?.flatMap((j) => j?.jobs_kits)
			?.filter((jk) => jk.job_batch === 0 || selectedBatches.includes(jk.job_batch)) || [];
	$: batches =
		$jobInfoStore?.data?.jobs?.map((j) => {
			return {
				quantity: j.quantity,
				batch: j.batch,
				reference: j.reference
			};
		}) || [];
	$: console.log('kits', jobs_kits);

	$: console.log('scanStore', $scanStore);

	$: console.log('lines', jobInfo?.assembly?.bom?.lines);

	$: totalKitItemQty = jobs_kits
		?.flatMap((k) => k.kits_items?.reduce((a, v) => a + v.quantity, 0))
		?.reduce((a, v) => a + v, 0);
	$: totalBomItemQty = jobInfo?.assembly?.bom?.lines?.length || 0;

	$: console.log('selectedBatches', selectedBatches);
</script>

{#if jobId}
	{#if $jobInfoStore.data}
		{#if jobInfo}
			<div class="flex">
				<div class="w-full">
					<JobOverview job={jobInfo}>
						<div class="pl-4">
							<!-- <div
								class:bg-red-600={incompleteOrders?.length > 0}
								class="w-6 h-6 center rounded-full inline-flex items-center justify-center"
							>
								<p class="text-white">{totalBomItemQty > totalKitItemQty ? incompleteOrders?.length : '✅'}</p>
							</div> -->
							{totalKitItemQty}/{totalBomItemQty * jobInfo.quantity}
						</div>
					</JobOverview>
				</div>
				<select
					class="w-1/8 h-20 my-auto rounded border-gray-300 dark:border-gray-600 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
					on:change={(e) => {
						selectedBatches = [Number(e?.target?.value || 0)];
					}}
				>
					{#each batches as batch}
						<option value={batch.batch}>
							{#if batch?.batch === 0}
								All
							{:else}
								{numberToLetter(batch.batch, 64)}
							{/if}
							({batch.quantity}-off)
						</option>
					{/each}
				</select>
			</div>
		{/if}
		{#if jobInfo?.assembly?.bom}
			<BomTableKitting bom={jobInfo?.assembly?.bom} job={jobInfo} {allocations} {jobs_kits} />
		{:else}
			<Alert color="red">No BOM set for this job assembly!</Alert>
		{/if}
	{:else}
		<Spinner color="blue" />
	{/if}
{:else}
	<!-- TODO: kitting dashboard -->
	<KittingDashboard />
{/if}
