<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	import { page } from '$app/stores';
	import { getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import JobOverview from '$lib/components/Job/JobOverview.svelte';
	import { scanStore, windowTitleStore } from '$lib/stores';
	import BomTableKitting from '$lib/components/BOM/BomTableKitting.svelte';
	import { Alert, Spinner } from 'flowbite-svelte';
	import KittingDashboard from '$lib/components/Kitting/KittingDashboard.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		$windowTitleStore = $page?.data?.jobId ? `Kitting ${$page?.data?.jobId}` : 'Kitting';
		return () => {
			$windowTitleStore = '';
		};
	});

	$: jobId = $page?.data?.jobId;

	$: jobInfoStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription jobInfo($jobId: bigint!) {
				jobs_by_pk(id: $jobId) {
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
					jobs_orders {
						id
						order {
							orders_items {
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
							id
							supplier {
								id
								name
							}
						}
					}
				}
			}
		`,
		variables: { jobId }
	});
	$: jobInfo = $jobInfoStore?.data?.jobs_by_pk;
	$: orders = jobInfo?.jobs_orders || [];
	$: kits = jobInfo?.jobs_kits?.map((jk) => jk.kit) || [];
	$: console.log('kits', kits);

	$: console.log('scanStore', $scanStore);

	$: console.log('orders', orders);
	$: console.log('kits', kits, jobInfo?.assembly?.bom?.lines);

	$: totalKitItemQty = kits?.flatMap((k) => k.kits_items?.reduce((a, v) => a + v.quantity, 0))?.reduce((a, v) => a + v, 0);
	$: totalBomItemQty = jobInfo?.assembly?.bom?.lines?.length || 0;
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
			</div>
		{/if}
		{#if jobInfo?.assembly?.bom}
			<BomTableKitting bom={jobInfo?.assembly?.bom} job={jobInfo} />
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
