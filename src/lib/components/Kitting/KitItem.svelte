<script lang="ts">
	import { clamp, classes, datetimeFormat } from '$lib/utils';
	import {
		Table,
		TableHead,
		TableHeadCell,
		TableBodyRow,
		TableBodyCell,
		Tooltip,
		Checkbox,
		Input,
		Button,
		Dropdown,
		Helper,
		Radio,
		Spinner,
		Label
	} from 'flowbite-svelte';
	import { mediaQuery, messagesStore } from 'svelte-legos';
	import PartInfo from '../PartInfo.svelte';
	import UserIcon from '../UserIcon.svelte';
	import { page } from '$app/stores';
	import { getContextClient, gql } from '@urql/svelte';
	import { PlusOutline } from 'flowbite-svelte-icons';
	import { getPrinters, printLabel, printerOnline } from '$lib/utils/bpac/bpac';
	import type { LabelContent } from '$lib/utils/bpac/bpac';
	import { onMount } from 'svelte';

	export let pn: string;
	export let part = {};
	export let job;
	export let bomLine = [];
	export let orderItems = [];
	export let kitItems = [];
	export let kits = [];
	export let kit = kits?.[0];
	export let visible = true;
	export let createCarrier = part?.properties?.type?.toLowerCase() === 'smt';
	export let createLabel = false;

	export let arbitraryQuantityVisible = false;

	export let arbitraryQuantity = 1;

	orderItems.forEach((i) => {
		let kitted = kitItems?.filter((ki) => ki.orders_item?.id === i.id);
		let kittedQty = kitted?.reduce((a, v) => (a = a + v.quantity), 0);
		if (!i?.__quantity) {
			//i.__quantity = i.quantity;
			i.__quantity = clamp(i.quantity, 1, i.quantity - kittedQty);
		}
		if (!i?.__selected) {
			i.__selected = true;
		}
		if (kittedQty >= i.quantity) {
			i.__selected = false;
			i.__quantity = 0;
			i.__kitted = true;
		}
	});
	const urqlClient = getContextClient();
	let quantityAdding = false;
	async function addQuantity() {
		if (quantityAdding) return;
		if (createLabel) {
			let printers = await getPrinters();
			if (printers.length == 0) {
				messagesStore(`CANNOT PRINT LABEL. No label printer available...`, 'error');
				return;
			}
			let online = await printerOnline(printers[0]);
			if (!online) {
				messagesStore(`CANNOT PRINT LABEL. Label printer ${printers[0]} offline...`, 'error');
				return;
			}
		}
		//TODO: Fix quantity control
		/* if (recievedQty >= orderItem.quantity || recievedQty + quantity > orderItem.quantity) {
			messagesStore('Quantity over order total', 'warning');
			return;
		} */
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
			return;
		}
		if (kittingTotal < 1) {
			messagesStore('Quantity to add must more than 0', 'warning');
			return;
		}
		if (!kit?.id) {
			messagesStore('No kit seleted', 'warning');
			return;
		}

		quantityAdding = true;
		let mutationResult;

		if (arbitraryQuantityVisible) {
			mutationResult = await urqlClient.mutation(
				gql`
					mutation insertKitQty($kit_id: uuid!, $quantity: Int!, $part: String) {
						insert_erp_kits_items_one(object: { kit_id: $kit_id, quantity: $quantity, part: $part }) {
							id
						}
					}
				`,
				{ kit_id: kit.id, quantity: arbitraryQuantity, part: pn }
			);
			if (mutationResult?.error) {
				console.error('MUTATION ERROR: ', mutationResult);
				messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
			} else {
				console.log('MUTATION RESULT: ', mutationResult);
				messagesStore('Inserted: ' + mutationResult.data.insert_erp_kits_items_one.id, 'success');
				let kitItemId = mutationResult.data.insert_erp_kits_items_one.id;
				if (createCarrier) {
					messagesStore('IMAGINARY CARRIER CREATED');
					/* mutationResult = await urqlClient.mutation(
						gql`
							mutation insertCarrier(
								$carrierid: String!
								$componentname: String!
								$owner: String
								$quantity: Int!
								$angle: Int = -90
								$batchid: String = ""
							) {
								insert_mydbcarrview_10_carrier_magname_one(
									object: {
										carrierid: $carrierid
										componentname: $componentname
										owner: $owner
										quantity: $quantity
										angle: $angle
										batchid: $batchid
									}
								) {
									carrierid
								}
							}
						`,
						{
							carrierid: 'EAMES#' + String(kitItemId),
							componentname: pn,
							owner: $page.data.user.initials,
							quantity: arbitraryQuantity,
							angle: -90,
							batchid: `${job?.id} #(${kitItemId})`
						}
					);
					if (mutationResult?.error) {
						console.error('MUTATION ERROR: ', mutationResult);
						messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
					} else {
						console.log('MUTATION RESULT: ', mutationResult);
						messagesStore(
							'Inserted carrier: ' + mutationResult.data.insert_mydbcarrview_10_carrier_magname_one.carrierid,
							'success'
						);
					} */
				}
			}
		} else {
			let itemsToKit = orderItems?.filter((i) => i.__selected && i.__quantity);
			let items = itemsToKit?.map((i) => {
				return {
					kit_id: kit.id,
					order_item_id: i.id,
					part: i?.part,
					quantity: i.__quantity
				};
			});
			console.log('itemstoadd:', items);
			if (remainingToReceive > 0) {
				mutationResult = await urqlClient.mutation(
					gql`
						mutation insertRecievedItems(
							$received_items: [erp_orders_items_received_insert_input!] = {}
							$kit_items: [erp_kits_items_insert_input!] = {}
						) {
							insert_erp_orders_items_received(objects: $received_items) {
								returning {
									id
								}
							}
							insert_erp_kits_items(objects: $kit_items) {
								returning {
									id
								}
							}
						}
					`,
					{
						kit_items: items,
						received_items: itemsToKit?.map((i) => {
							return {
								orders_items_id: i.id,
								quantity: i.__quantity
							};
						})
					}
				);
				if (mutationResult?.error) {
					console.error('MUTATION ERROR: ', mutationResult);
					messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
				} else {
					console.log('MUTATION RESULT: ', mutationResult);
					messagesStore(
						'Inserted: Receipt:' +
							mutationResult.data.insert_erp_orders_items_received.returning?.[0]?.id +
							' Kitting:' +
							mutationResult.data.insert_erp_kits_items.returning?.[0]?.id,
						'success'
					);
				}
			} else {
				mutationResult = await urqlClient.mutation(
					gql`
						mutation insertKitItems($items: [erp_kits_items_insert_input!] = {}) {
							insert_erp_kits_items(objects: $items) {
								returning {
									id
								}
							}
						}
					`,
					{ items }
				);
				if (mutationResult?.error) {
					console.error('MUTATION ERROR: ', mutationResult);
					messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
				} else {
					console.log('MUTATION RESULT: ', mutationResult);
					messagesStore('Inserted: ' + mutationResult.data.insert_erp_kits_items.returning?.[0]?.id, 'success');
				}
			}
			if (!mutationResult?.error) {
				if (createCarrier) {
					messagesStore('IMAGINARY CARRIER CREATED');
				}
				if (createLabel) {
					if (!mutationResult.data.insert_erp_kits_items.returning?.[0]?.id) {
						messagesStore('Kitting error, label print skipped...', 'error');
					} else {
						const carrierid = `EAMES#${mutationResult.data.insert_erp_kits_items.returning?.[0]?.id}`;
						let labelContent: LabelContent[] = [
							{
								name: 'barcode',
								type: 'barcode',
								content: 'R' + carrierid
							},
							{
								name: 'barcode_pn',
								type: 'barcode',
								content: pn
							},
							{
								name: 'pn',
								type: 'text',
								content: pn
							},
							{
								name: 'carrier',
								type: 'text',
								content: carrierid
							},
							{
								name: 'notes',
								type: 'text',
								content: ''
							},
							{
								name: 'description',
								type: 'text',
								content: ''
							},
							{
								name: 'freeissue',
								type: 'text',
								content: ''
							},
							{
								name: 'batch',
								type: 'text',
								content: job?.id
							}
						];
						let printResult = await printLabel('C:\\Users\\george\\Documents\\label_template.lbx', labelContent);
						if (printResult) {
							messagesStore('LABEL PRINTED');
						} else {
							messagesStore('LABEL PRINT FAILED', 'error');
						}
					}
				}
			}
		}
		visible = false;
		quantityAdding = false;
	}

	let kitAdding = false;
	async function addKit() {
		if (kitAdding) return;
		//TODO: Fix quantity control
		/* if (recievedQty >= orderItem.quantity || recievedQty + quantity > orderItem.quantity) {
			messagesStore('Quantity over order total', 'warning');
			return;
		} */
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
			return;
		}

		kitAdding = true;
		let mutationResult;
		mutationResult = await urqlClient.mutation(
			gql`
				mutation insertKit($job_id: bigint) {
					insert_material_jobs_kits(objects: { job_id: $job_id, kit: { data: {} } }) {
						returning {
							id
							job {
								id
							}
							kit {
								id
								kits_items {
									id
								}
							}
							kit_id
						}
					}
				}
			`,
			{ job_id: job.id }
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore('Inserted: ' + mutationResult.data.insert_material_jobs_kits.returning?.[0]?.kit?.id, 'success');
			if (!kit) {
				kit = mutationResult.data.insert_material_jobs_kits.returning?.[0]?.kit;
			}
		}
		kitAdding = false;
	}

	onMount(async () => {
		let printer = await printerOnline();
		createLabel = printer;
		createCarrier = printer;
	});

	$: orderTotal = orderItems?.map((i) => i.quantity)?.reduce((a, v) => a + v, 0);
	$: receivedTotal = orderItems
		?.map((i) => i.orders_items_receiveds)
		?.flat()
		?.reduce((a, v) => (a = a + v.quantity), 0);
	$: remainingToReceive = orderTotal - receivedTotal;
	$: kittingTotal = arbitraryQuantityVisible
		? arbitraryQuantity
		: orderItems
				?.filter((i) => i?.__selected)
				?.map((i) => i?.__quantity || 0)
				?.reduce((a, v) => a + v, 0);

	let partInfo;
	let descriptionOkCheckbox = false;
	$: descriptionOk = bomLine?.[0]?.description === partInfo?.description || descriptionOkCheckbox;
</script>

<svelte:window
	on:keydown={(e) => {
		console.log(e);
		if (e.key === 'Enter') {
			if (!descriptionOkCheckbox) {
				descriptionOkCheckbox = true;
			} else {
				addQuantity();
				visible = false;
			}
		}
	}}
/>

<div class="py-4">
	<div class="flex">
		<div class="w-1/2">
			{#if remainingToReceive > 0}
				<p class="font-semibold text-lg underline text-red-600">You are attempting to kit more than recieved</p>
			{/if}
			{#if !arbitraryQuantityVisible}
				<p class="font-bold pb-2 text-lg" class:text-red-600={kittingTotal < 1}>
					Kit {remainingToReceive > 0 ? ' & recieve ' : ''}{kittingTotal} from {orderItems?.filter((i) => i.__selected)
						.length} order(s)
				</p>
			{:else}
				<p class="font-bold text-lg underline text-red-600">Kit {kittingTotal}</p>
				<p class="pb-2 italic text-red-600">arbitrary amount not associated with an order</p>
			{/if}
			<div>
				<Helper>Description check</Helper>
				<div class="flex border rounded-md p-1">
					<p class={`font-semibold uppercase ${descriptionOk ? 'text-green-500' : 'text-red-600'}`}>
						{bomLine?.[0]?.description || partInfo?.description}
					</p>
					<div class="my-auto mx-auto">
						<Checkbox bind:checked={descriptionOkCheckbox} />
					</div>
				</div>
			</div>
			<div>
				<Helper>Part info</Helper>
				<div class="flex border rounded-md p-1">
					<PartInfo partId={pn} showPopoutButton={false} bind:partInfo />
				</div>
			</div>
		</div>
		<div class="w-1/4 px-1 h-52 overflow-y-auto">
			<ul>
				{#each kits as k, idx}
					<li class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600 uppercase">
						<Label class={'flex items-center'}>
							<input
								type="radio"
								on:change={() => (kit = k)}
								checked={k.id === kit.id}
								value={k.id}
								class={'mr-2 w-4 h-4 bg-gray-100 border-gray-300 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'}
							/>
							{idx + 1}
						</Label>
						<Helper class="pl-6">{k.id.split('-').slice(-1)}</Helper>
					</li>
				{:else}{/each}
				<li class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600 uppercase">
					<Label class={'flex items-center text-xs gap-x-2'}>
						<Button color="blue" size="xs" on:click={() => addKit()}><PlusOutline size="xs" /></Button>
						Add kit
					</Label>
				</li>
			</ul>
		</div>
		<div class="w-1/4">
			<div class="">
				<div class="flex">
					<Button
						color="blue"
						size="sm"
						disabled={kittingTotal < 1 || !kit?.id || !descriptionOkCheckbox}
						on:click={() => addQuantity()}
					>
						Add
						{#if quantityAdding}
							<Spinner class="ml-3" size="3" color="white" />
						{/if}
					</Button>
					{#if !kit?.id || !descriptionOkCheckbox}
						<Tooltip
							>{(!kit?.id ? ' NO KIT SELECTED ' : '') + (!descriptionOkCheckbox ? ' DESCRIPTION NOT CHECKED ' : '')}</Tooltip
						>
					{/if}
					{#if arbitraryQuantityVisible}
						<div
							class="w-1/2 mx-auto"
							on:mousewheel={(e) => {
								arbitraryQuantity = Math.max(arbitraryQuantity + (e.deltaY > 0 ? -1 : +1), 1);
							}}
						>
							<Input
								size="sm"
								type="number"
								value={arbitraryQuantity}
								on:input={(e) => {
									arbitraryQuantity = Math.max(Number(e.target.value), 1);
								}}
							/>
						</div>
					{/if}
				</div>
				<div class="mt-1">
					<Checkbox bind:checked={arbitraryQuantityVisible}>Arbitrary quantity</Checkbox>
				</div>
				<div class="mt-10">
					<Checkbox bind:checked={createCarrier}>Create carrier</Checkbox>
					<div class="mt-4">
						{#await printerOnline() then online}
							{#if !online}
								<Checkbox bind:checked={createLabel} disabled={true}>Print label</Checkbox>
								<Helper helperClass={'text-xs font-normal text-gray-500 dark:text-gray-300 pl-6' + classes.link} color="red">
									No printer available
								</Helper>
							{:else}
								<Checkbox bind:checked={createLabel}>Print label</Checkbox>
								{#await getPrinters() then printers}
									<Helper
										helperClass={'text-xs font-normal text-gray-500 dark:text-gray-300 pl-6' + classes.link}
										color="green"
									>
										{printers[0]}
									</Helper>
								{/await}
							{/if}
						{/await}
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="mt-6">
		{#if !arbitraryQuantityVisible}
			<Table>
				<TableHead theadClass="uppercase text-center">
					<TableHeadCell>Buyer</TableHeadCell>
					<TableHeadCell>Time/Date</TableHeadCell>
					<TableHeadCell>Order</TableHeadCell>
					<TableHeadCell>Order Qty</TableHeadCell>
					<TableHeadCell>Kitted Qty</TableHeadCell>
					<TableHeadCell>Quantity</TableHeadCell>
					<TableHeadCell>
						{#if orderItems.filter((i) => !i?.__kitted).length == 0}
							<Checkbox checked={true} disabled={true} color="green" />
						{:else}
							<Checkbox
								on:change={(e) => {
									orderItems.forEach((i) => {
										if (!i.__kitted) {
											i.__selected = e.target.checked;
										}
									});
									orderItems = orderItems;
								}}
								disabled={!orderItems.length}
								checked={orderItems.length > 0 && orderItems.filter((i) => !i?.__selected && !i?.__kitted).length == 0}
							/>
						{/if}
					</TableHeadCell>
				</TableHead>

				{#each orderItems as orderItem, idx}
					{@const kittedQty = kitItems
						?.filter((ki) => ki.orders_item?.id === orderItem.id)
						?.reduce((a, v) => (a = a + v.quantity), 0)}
					<TableBodyRow>
						<TableBodyCell tdClass="font-sm text-center">
							<UserIcon size="xs" user={orderItem?.user}>
								{#if mediaQuery('(min-width: 1024px)')}
									{orderItem?.user?.username || 'Unknown'}
								{/if}
							</UserIcon>
							<Tooltip placement="right">
								{#if orderItem?.user?.first_name}
									{orderItem?.user?.first_name}
									{orderItem?.user?.last_name}
								{:else}
									Unknown user...
								{/if}
							</Tooltip>
						</TableBodyCell>
						<TableBodyCell tdClass="font-sm text-center">
							{datetimeFormat(orderItem.updated_at)}
						</TableBodyCell>
						<TableBodyCell tdClass="font-sm text-center">
							<a href={`${window.origin}/order/${orderItem.order.id}`} target="_blank" class={classes.link}>
								{orderItem.order.id}
							</a>
						</TableBodyCell>
						<TableBodyCell tdClass="font-sm text-center">{orderItem.quantity}</TableBodyCell>
						<TableBodyCell tdClass="font-sm text-center">{kittedQty}</TableBodyCell>
						<TableBodyCell tdClass="font-sm text-center">
							<div
								class="w-1/2 mx-auto"
								on:mousewheel={(e) => {
									orderItem.__quantity = clamp(
										orderItem.__quantity + (e.deltaY > 0 ? -1 : +1),
										1,
										orderItem.quantity - kittedQty
									);
								}}
							>
								<Input
									size="sm"
									type="number"
									value={orderItem.__quantity}
									disabled={!orderItem?.__selected}
									on:input={(e) => {
										orderItem.__selected = true;
										orderItem.__quantity = clamp(Number(e.target.value), 1, orderItem.quantity - kittedQty);
									}}
								/>
							</div>
						</TableBodyCell>
						<TableBodyCell tdClass="font-sm text-center">
							{#if orderItem?.__kitted}
								<Checkbox checked={orderItem.__kitted} disabled={orderItem.__kitted} color="green" />
							{:else}
								<Checkbox bind:checked={orderItem.__selected} disabled={orderItem.__kitted} />
							{/if}
						</TableBodyCell>
					</TableBodyRow>
				{:else}
					<TableBodyCell colspan="3">No linked orders for this line</TableBodyCell>
				{/each}
				<TableHead>
					<TableBodyCell />
					<TableBodyCell />
					<TableBodyCell />
					<TableBodyCell tdClass="font-sm text-center font-bold">
						{orderTotal}
					</TableBodyCell>
					<TableBodyCell tdClass="font-sm text-center font-bold"
						>{kitItems?.reduce((a, v) => (a = a + v.quantity), 0)}</TableBodyCell
					>
					<TableBodyCell tdClass="font-sm text-center font-bold">
						{kittingTotal}
					</TableBodyCell>
					<TableBodyCell tdClass="font-sm text-center font-bold">
						{orderItems?.filter((i) => i?.__selected).length}
					</TableBodyCell>
				</TableHead>
			</Table>
		{/if}
	</div>
</div>
