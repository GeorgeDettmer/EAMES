<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	import { AccordionItem, Accordion, Indicator } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import OrderOverview from '$lib/components/Orders/OrderOverview.svelte';
	import ReceivingOverview from '$lib/components/Receiving/ReceivingOverview.svelte';
	import OrdersListItem from '$lib/components/Orders/OrdersListItem.svelte';
	import JobOverview from '$lib/components/Job/JobOverview.svelte';
	import { scanStore } from '$lib/stores';
	import { messagesStore } from 'svelte-legos';
	import { ChevronDoubleDown, ChevronDoubleUp } from 'svelte-heros-v2';
	import { EllipseHorizontalSolid } from 'flowbite-svelte-icons';

	$: jobId = $page?.data?.jobId;

	$: jobInfoStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription jobInfo($jobId: bigint!) {
				jobs_by_pk(id: $jobId) {
					id
					quantity
					batch
					assembly {
						id
						name
						revision_external
						revision_internal
						bom {
							id
							lines_aggregate {
								aggregate {
									count
								}
							}
						}
						assemblies_cad {
							id
							data
							name
						}
					}
					customer {
						name
					}

					jobs_orders {
						id
						order {
							orders_items {
								id
								created_at
								order_id
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
							reference
							supplier {
								id
								name
								approved
								risk_level
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

	$: incompleteOrders = orders?.filter(
		(o) =>
			o?.order?.orders_items?.filter((i) => i.quantity !== i.orders_items_receiveds?.reduce((a, v) => a + v.quantity, 0))
				?.length !== 0
	);
	$: console.log('incompleteOrders', incompleteOrders);

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

	let accordionState = [];
	$: console.log('accordionState', accordionState);

	let highlightOrderItems = [];

	function toggleAccordions(open: boolean | undefined = undefined) {
		accordionState.forEach((v, i) => {
			accordionState[i] = open === undefined ? !accordionState[i] : open;
		});
	}
</script>

{#if jobId}
	{#if jobId.startsWith('PO')}
		<OrderOverview orderId={jobId?.slice(2)} showRecieved />
	{:else if orders}
		{#if jobInfo}
			<div class="flex">
				<div class="w-full">
					<JobOverview job={jobInfo}>
						<div class="pl-4">
							<div
								class:bg-red-600={incompleteOrders?.length > 0}
								class="w-6 h-6 center rounded-full inline-flex items-center justify-center"
							>
								<p class="text-white">{incompleteOrders?.length > 0 ? incompleteOrders?.length : '✅'}</p>
							</div>
						</div>
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
		<Accordion multiple flush>
			{#each orders as { order }, idx}
				{@const linesToRecieve = order.orders_items?.filter(
					(i) => i.quantity !== i.orders_items_receiveds?.reduce((a, v) => a + v.quantity, 0)
				)?.length}

				<AccordionItem paddingFlush="p-0" paddingDefault="p-0" bind:open={accordionState[idx]}>
					<div slot="header" class="grid grid-cols-2">
						<OrdersListItem {order}>
							<div class="pl-4">
								<div
									class:bg-red-600={linesToRecieve > 0}
									class="w-6 h-6 center rounded-full inline-flex items-center justify-center"
								>
									<p class="text-white">{linesToRecieve > 0 ? linesToRecieve : '✅'}</p>
								</div>
							</div>
						</OrdersListItem>
					</div>
					<div class="p-1">
						<!-- TODO: Redo all bindings -->
						<!-- <OrderOverview
							orderId={order?.id}
							showRecieved
							showHeader={false}
							highlightOrderItem={accordionState[idx]}
							bind:orderItemSelected={accordionState[idx]}
							orderItemSelectedQty={scanPartTokens?.qty}
							bind:recieveModal={accordionState[idx].id}
						/> -->
						<OrderOverview
							orderId={order?.id}
							showRecieved
							showHeader={false}
							bind:highlightOrderItems
							bind:orderItemSelected={accordionState[idx]}
							orderItemSelectedQty={scanPartTokens?.qty}
						/>
					</div>
				</AccordionItem>
			{:else}
				No orders associated with this job number
			{/each}
		</Accordion>
	{:else}{/if}
{:else}
	<ReceivingOverview />
{/if}
