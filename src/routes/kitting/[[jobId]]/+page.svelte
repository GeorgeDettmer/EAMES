<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	import { page } from '$app/stores';
	import { getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import OrderOverview from '$lib/components/Orders/OrderOverview.svelte';
	import JobOverview from '$lib/components/Job/JobOverview.svelte';
	import { scanStore } from '$lib/stores';
	import { messagesStore } from 'svelte-legos';
	import { ChevronDoubleDown, ChevronDoubleUp } from 'svelte-heros-v2';
	import { EllipseHorizontalSolid } from 'flowbite-svelte-icons';
	import KitList from '$lib/components/Kitting/KitList.svelte';
	import BomTableKitting from '$lib/components/BOM/BomTableKitting.svelte';

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
							lines(order_by: { part: asc_nulls_last, reference: asc_nulls_last }) {
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
								order {
									id
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

	let scanPartTokens;
	$: {
		if ($scanStore) {
			let r = $scanStore
				?.toLowerCase()
				?.match(/(?<CON>(06k).*)(?<MPN>(p1p).*)(?<SPN>(3p).*)(?<QTY>(q).*)(?<UNDEFINED>(9d).*)/);
			/* $scanStore?.split(/(?<CON>(06K).*)(?<MPN>(P1P).*)(?<SPN>(3P).*)/); */
			console.log('scanPartTokens', r?.groups);
			//TODO: Fix regex not to include prefixes is capture groups...
			scanPartTokens = {
				spn: r?.groups?.SPN?.slice(2),
				mpn: r?.groups?.MPN?.slice(3),
				qty: Number(r?.groups?.QTY?.slice(1))
			};
			console.log('scanPartTokens', scanPartTokens);
			scanStore.set('');
			if (scanPartTokens?.mpn) {
				let ordersContainingPart = orders.filter(
					({ order }) => order.orders_items.filter((i) => i?.part?.toLowerCase() === scanPartTokens?.mpn).length > 0
				);
				//TODO: Redo all this binding of values, its a mess
				/* accordionState = orders.map(({ order }) => {
					let items = order.orders_items.filter((i) => i?.part?.toLowerCase() === scanPartTokens?.mpn);
					let item = items?.[0];
					if (item) {
						order._open = true;
						if (scanPartTokens?.qty) {
							item._qty = scanPartTokens.qty;
						}
					}
					return item?.id ? item : false;
				}); */
				highlightOrderItems = orders
					.map(({ order }, idx) => {
						let items = order.orders_items.filter((i) => i?.part?.toLowerCase() === scanPartTokens?.mpn);
						let item = items?.[0];
						console.log('i', items, item);
						accordionState[idx] = item;
						return items;
					})
					?.flat();
				console.log('ordersContainingPart', ordersContainingPart, 'highlightOrderItems', highlightOrderItems);
				messagesStore(`Part scanned. ${scanPartTokens?.mpn} found in ${ordersContainingPart?.length} order(s)`);
			}
		}
	}
	$: console.log('orders', orders);

	let accordionState: boolean[] = [];
	$: console.log('accordionState', accordionState);

	let highlightOrderItems = [];

	function toggleAccordions(open: boolean | undefined = undefined) {
		accordionState.forEach((v, i) => {
			accordionState[i] = open === undefined ? !accordionState[i] : open;
		});
	}
</script>

{#if jobId}
	{#if jobInfo}
		<div class="flex">
			<div class="w-full">
				<JobOverview job={jobInfo}>
					<!-- <div class="pl-4">
							<div
								class:bg-red-600={incompleteOrders?.length > 0}
								class="w-6 h-6 center rounded-full inline-flex items-center justify-center"
							>
								<p class="text-white">{incompleteOrders?.length > 0 ? incompleteOrders?.length : '✅'}</p>
							</div>
						</div> -->
				</JobOverview>
			</div>
			<div class="my-auto ml-2 -mr-1 hover:cursor-pointer">
				<ChevronDoubleUp
					on:click={() => {
						toggleAccordions(false);
					}}
				/>
				<EllipseHorizontalSolid
					on:click={() => {
						toggleAccordions();
					}}
				/>
				<ChevronDoubleDown
					on:click={() => {
						toggleAccordions(true);
					}}
				/>
			</div>
		</div>
	{/if}
	<KitList {kits} bind:accordionState />
	{#if jobInfo?.assembly?.bom}
		<BomTableKitting bom={jobInfo?.assembly?.bom} job={jobInfo} />
	{/if}
{:else}
	TODO: kitting dashboard
{/if}
