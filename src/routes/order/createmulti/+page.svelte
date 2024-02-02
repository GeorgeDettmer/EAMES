<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	import { page } from '$app/stores';
	import OrderCreateMulti from '$lib/components/Orders/OrderCreateMulti.svelte';
	import {
		Tabs,
		TabItem,
		Alert,
		Button,
		Checkbox,
		Select,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Toggle,
		Badge,
		Tooltip
	} from 'flowbite-svelte';
	import { messagesStore } from 'svelte-legos';
	import { InfoCircleSolid, PlusOutline } from 'flowbite-svelte-icons';
	import { getContextClient, gql, queryStore, subscriptionStore } from '@urql/svelte';
	import OrderCreateHeader from '$lib/components/Orders/OrderCreateHeader.svelte';
	import { goto } from '$app/navigation';
	import { filedrop, type FileDropOptions, type Files } from 'filedrop-svelte';
	import XLSX from 'xlsx';
	import { getParameterInsensitiveAny } from '$lib/utils';
	import { windowTitleStore } from '$lib/stores';
	import { onDestroy } from 'svelte';
	import EditableText from '$lib/components/Misc/EditableText.svelte';
	import OrderShipment from '$lib/components/Orders/OrderShipment - Copy.svelte';
	import type { Shipment } from '$lib/types';
	import { XMark } from 'svelte-heros-v2';

	$windowTitleStore = 'New order';
	onDestroy(() => {
		$windowTitleStore = '';
	});

	$: user = {
		id: $page?.data?.user?.id,
		username: $page?.data?.user?.username,
		first_name: $page?.data?.user?.firstname,
		last_name: $page?.data?.user?.lastname,
		initials: $page?.data?.user?.initials,
		color: $page?.data?.user?.color
	};

	let headers = {};
	function excelToObjects(stringData) {
		let objects = [];
		//split into rows
		let rows = stringData.split('\n');

		//Make columns
		let columns = rows[headerRow >= 0 ? headerRow : 0].split(importSeparator);

		let newColumns = columns.map((c, idx) => `${c} (${XLSX.utils.encode_col(idx)})`);

		//Note how we start at rowNr = 1, because 0 is the column row
		for (let rowNr = headerRow >= 0 ? 1 : 0; rowNr < rows.length; rowNr++) {
			let o = {};
			let data = rows[rowNr].split(importSeparator);
			if (rows[rowNr] && data) {
				//Loop through all the data
				for (let cellNr = 0; cellNr < data.length; cellNr++) {
					o[newColumns[cellNr]] = data[cellNr]?.trim();
				}
				o._import = true;
				objects.push(o);
			}
		}
		console.log('parsedObjects:', columns, newColumns);
		headers = {};
		newColumns?.forEach((h, idx) => {
			if (h?.[0] && h?.[0] !== '_') {
				//headers[`${h}${headers?.[h] !== undefined ? `(${idx + 1})` : ''}`] = '';
				headers[h] = '';
			}
		});
		console.log('headers', headers);
		/* objects
			?.map((l) => Object.keys(l))
			?.flat()
			?.forEach((h, idx) => {
				if (h?.[0] && h?.[0] !== '_') {
					headers[`${h}${headers?.[h] !== undefined ? `(${idx + 1})` : ''}`] = '';
					//headers[h] = '';
				}
			}); */
		//console.log('headers', headers);

		return objects;
	}

	let headerRow: number = 0;
	let importSeparator: string = '\t';
	let importText: string = '';
	let showImport: boolean = false;
	let imported: any[] = []; //excelToObjects(importText).filter((line) => line?.['Part Number Description'] && line?.['Qty/Unit']);

	function fillOrderFromImport() {
		let toImport = imported?.filter((l) => l?._import !== false);
		console.log('toImport', toImport, imported);
		let importSuppliers = new Set(toImport?.map((l) => l?.[orderItemProperties['supplier']]?.toLowerCase()));
		let importSuppliersInvalid = [...importSuppliers].filter((is) => !suppliersNames.includes(is.toLowerCase()));
		if (importSuppliersInvalid.length > 0) {
			messagesStore(
				`Suppliers in the import do not exist in the suppliers library. Invalid suppliers: ${importSuppliersInvalid}`
			);
			return;
		}
		showImport = false;
		let order = {};
		let order_items = [];
		let importOrders = {};
		let importShipments = [];
		toImport.forEach((line, idx) => {
			if (line) {
				let part = line?.[orderItemProperties['part']];
				let spn = line?.[orderItemProperties['spn']];
				let price = Number(line?.[orderItemProperties['price']]?.replace(/[^0-9\.-]+/g, '')) || 0;
				let quantity = Number(line?.[orderItemProperties['quantity']]);
				//console.log({ part, spn, price, quantity });
				if (!part) {
					messagesStore(`Import failed for line ${idx + 1}. Missing part number or price`, 'error');
					return;
				}
				if (!quantity) {
					messagesStore(`Import failed for line ${idx + 1}. Quantity is 0`, 'error');
					return;
				}
				if (!price) {
					//messagesStore(`Line ${idx + 1} has 0 price`);
				}
				let importSuppierName = line?.[orderItemProperties['supplier']];
				if (!importOrders?.[importSuppierName]) {
					importOrders[importSuppierName] = [];
					importOrders[importSuppierName].user = $page?.data?.user;
					importOrders[importSuppierName].supplier = suppliers?.filter((s) =>
						s.names?.includes(importSuppierName?.toLowerCase())
					)?.[0];
					importOrders[importSuppierName].orders_items = [];
				}
				let defaultAllocationJob = allocated?.[0];
				importOrders[importSuppierName].orders_items = [
					...importOrders[importSuppierName].orders_items,
					{
						part,
						spn,
						price,
						quantity: quantity,
						created_at: new Date(),
						/* user_id: $page?.data?.user?.id, */
						category: 'Component',
						jobs_allocations: [
							{
								quantity: null,
								job_id: defaultAllocationJob?.id,
								job_batch: defaultAllocationJob?.batch,
								user_id: $page?.data?.user?.id
							}
						]
					}
				];
			}
		});
		console.log('importOrders', importOrders, Object.values(importOrders));
		orders = Object.values(importOrders);
		importShipments = orders.map((o) => {
			return [shipmentTemplate()];
		});
		shipments = importShipments;
	}

	let orderItemProperties = {
		part: 'MPN',
		quantity: 'Order',
		price: 'Unit(£)',
		supplier: 'Supplier',
		spn: 'Purchased Part'
	};
	let defaultOrderItemProperties = orderItemProperties;

	$: missingImportData = imported?.map(
		(i) => ['part', 'quantity', 'price'].filter((k) => !i?.[orderItemProperties[k]])?.length !== 0
	);

	$: missingImportData2 = imported?.map((i) =>
		[
			() => [!i?.[orderItemProperties['part']], 'Part undefined'],
			() => [!i?.[orderItemProperties['quantity']], 'Quantity undefined'],
			() => [isNaN(Number(i?.[orderItemProperties['quantity']])), 'Quantity is not a number'],
			() => [!i?.[orderItemProperties['price']], 'Price undefined'],
			() => [isNaN(Number(i?.[orderItemProperties['price']])), 'Price is not a number'],
			() => [!i?.[orderItemProperties['supplier']], 'Supplier undefined'],
			() => [suppliersNames.every((n) => n !== i?.[orderItemProperties['supplier']]?.toLowerCase()), 'Supplier invalid']
		].map((check) => check())
	);

	$: jobsStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription order {
				jobs(order_by: { id: desc, batch: asc_nulls_first }, limit: 1000) {
					id
					batch
					customer {
						name
					}
				}
			}
		`
	});
	$: jobs =
		$jobsStore?.data?.jobs?.map((j) => {
			return { value: j, name: `${j.id} ${j?.batch && j.batch > 0 ? `(${String.fromCharCode(64 + j.batch)})` : ''}` };
		}) || [];
	let job;

	$: suppliersStore = queryStore({
		client: getContextClient(),
		query: gql`
			query suppliers {
				erp_suppliers(order_by: { orders_aggregate: { count: desc } }) {
					id
					name
					names
				}
			}
		`,
		variables: {}
	});
	$: suppliers = $suppliersStore?.data?.erp_suppliers;
	$: suppliersNames = suppliers?.flatMap((s) => s.names)?.map((n) => n?.toLowerCase());
	//$: console.log('suppliersNames', suppliersNames);
	let selectedSupplierId = undefined;

	let orders = [];
	$: console.log('PAGE ORDERS:', orders);

	$: {
		if (!$suppliersStore.fetching && orders.length === 0) {
			addOrder();
		}
	}

	$: ordersItems = orders?.flatMap((o) => o?.orders_items) || [];

	function addOrder(force: boolean = true) {
		let supplier = Object.assign({}, suppliers?.[0] || {});

		orders = [
			...orders,
			{
				orders_items: [],
				/* supplier_id: 'FARNELL', */
				/* tracking: [], */
				supplier: supplier,
				user_id: $page?.data?.user?.id,
				user
			}
		];
		shipments = [
			...shipments,
			[
				{
					carrier: { ...carriers?.[0] } || {
						id: null
					},
					expected_delivery_date: new Date().toISOString(),
					tracking: {
						tracking_number: ''
					}
				}
			]
		];
	}

	function removeOrder(idx: number) {
		orders = orders.filter((o, i) => i !== idx);
		shipments = shipments.filter((s, i) => i !== idx);
		tabState = tabState.filter((s, i) => i !== idx);

		if (!orders.length) {
			addOrder();
		}
		tabState = [true];
	}

	const urqlClient = getContextClient();
	let ordersAdding = false;
	async function addOrders() {
		if (ordersAdding) return;
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
			return;
		}
		if ($page?.data?.user?.processes && !$page?.data?.user?.processes?.['purchase']) {
			messagesStore(
				`You do not have permission to create orders. You have permission for: ${Object.keys($page?.data?.user?.processes)}`,
				'warning'
			);
			return;
		}
		/* if (job === '') {
			messagesStore('Choose a job to assign orders to or choose "N/A"', 'error');
			return;
		} */
		if (orders.length === 0) {
			messagesStore('No orders to create', 'error');
			return;
		}
		if (ordersItems.length === 0) {
			messagesStore('There must be some order items to submit an order', 'error');
			return;
		}
		if (!orders.every((o) => o.orders_items.length > 0)) {
			messagesStore('An order contains no order items, remove the order or add items to it', 'error');
			return;
		}

		ordersAdding = true;
		let mutationResult;

		console.log('addShipments', shipments);
		let shipmentIds: number[][] = [];
		for (const orderShipments of shipments) {
			let shipmentMutationObject = orderShipments.map((shipment) => {
				let r = {
					carrier_id: shipment?.carrier?.id,
					expected_delivery_date: shipment?.expected_delivery_date
				};
				if (shipment?.tracking?.tracking_url) {
					r.tracking = {
						data: shipment?.tracking
					};
				}
				return r;
			});
			mutationResult = await urqlClient.mutation(
				gql`
					mutation addShipments($shipments: [erp_shipments_insert_input!] = {}) {
						insert_erp_shipments(objects: $shipments) {
							affected_rows
							returning {
								id
							}
						}
					}
				`,
				{
					shipments: shipmentMutationObject
				}
			);
			if (mutationResult?.error) {
				console.error('MUTATION ERROR: ', mutationResult);
				messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
				return shipmentIds.push([]);
			} else {
				console.log('MUTATION RESULT: ', mutationResult);
				shipmentIds.push(mutationResult?.data?.insert_erp_shipments?.returning?.map((s) => s.id));
			}
		}
		messagesStore('Inserted shipment(s): ' + shipmentIds.flat(), 'success');
		if (shipmentIds.length === 0 || shipmentIds.every((v) => v?.length === 0)) {
			console.error('SHIPMENT CREATE ERROR', shipmentIds, shipments);
			return;
		} else {
			console.log('addSHIPMENTS', shipmentIds);
		}
		console.log('addOrders', orders);
		let objects = orders.map((o, orderIdx) => {
			let obj = {
				supplier_id: o.supplier.id,
				user_id: $page?.data?.user?.id,
				reference: o.reference
			};

			let items = o.orders_items.map((i) => {
				let item = {
					category: i?.category,
					part: i?.part,
					spn: i?.spn,
					quantity: i?.quantity,
					price: i?.price,
					created_at: i?.created_at
				};
				/* if (job?.id) { 
					item.jobs_allocations = {
						data: [
							{
								quantity: i?.quantity,
								job_id: job?.id,
								job_batch: job?.batch,
								user_id: $page?.data?.user?.id
							}
						]
					};
				}*/
				if (i?.jobs_allocations && i?.jobs_allocations.length > 0) {
					item.jobs_allocations = {
						data: i.jobs_allocations
					};
				}
				if (shipmentIds?.[orderIdx]?.[i.__shipmentIdx]) {
					item.orders_items_shipments = {
						data: [
							{
								shipment_id: shipmentIds[orderIdx][i.__shipmentIdx]
							}
						]
					};
				}
				return item;
			});

			obj.orders_items = {
				data: items
			};

			/* if (job?.id) {
				obj.jobs_orders = {
					data: [
						{
							job_id: job.id
						}
					]
				};
			} */

			return obj;
		});

		console.log('objects', objects);

		mutationResult = await urqlClient.mutation(
			gql`
				mutation addOrders($objects: [erp_orders_insert_input!] = []) {
					insert_erp_orders(objects: $objects) {
						returning {
							id
							orders_items {
								id
							}
							jobs_orders {
								id
								job_id
							}
						}
					}
				}
			`,
			{
				objects
			}
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore('Inserted order(s): ' + mutationResult?.data?.insert_erp_orders?.returning?.map((r) => r.id), 'success');
			goto('/order');
		}
		ordersAdding = false;
	}

	let openOrderIdx = 0;
	let jobListVisible = true;

	let options: FileDropOptions = {
		windowDrop: true,
		clickToUpload: false
	};
	let files: Files;
	const _config = {
		bom: {
			headings: {
				part: ['ipn', 'pn', 'part', 'mpn'],
				description: ['description', 'desc'],
				quantity: ['quantity', 'quantities', 'qty'],
				references: ['reference', 'references', 'refdes']
			},
			template: {
				default: ['MPN', 'Description', 'RefDes', 'Qty']
			}
		}
	};
	async function handleDropAsync(e) {
		e.stopPropagation();
		e.preventDefault();
		try {
			const f = e.dataTransfer.files[0];
			const data = await f.arrayBuffer();
			const wb = XLSX.read(data);
			const ws = getParameterInsensitiveAny(wb.Sheets, ['bom']);
			if (!ws) {
				messagesStore("The supplied workbook does not include a sheet named 'BOM'. Found: " + wb.SheetNames);
			}
			console.log(wb.Sheets, ws);
			let lines = XLSX.utils.sheet_to_json(ws);
			const includesAll = (arr, values) => values.every((v) => arr.includes(v));
			let headingRow = lines.findIndex((v) => includesAll(Object.values(v), _config.bom.template.default));
			let sheetText = XLSX.utils.sheet_to_txt(ws, {});
			if (ws['!autofilter']?.ref) {
				let range = XLSX.utils.decode_range(ws['!autofilter']?.ref);
				let textSplit = sheetText.split('\n');
				let newText = textSplit.slice(range.s.r, range.e.r + 1).join('\n');
				sheetText = newText;
			}
			/* if (headingRow > -1) {
			sheetText = sheetText.split('/n').slice(headingRow).join('/n');
			console.log(sheetText, headingRow);
		} */

			orderItemProperties = {
				part: 'MPN (O)',
				quantity: 'Order (T)',
				price: 'Unit(£) (U)',
				spn: 'Purchased Part (Q)',
				supplier: 'Supplier (N)'
			};

			importText = sheetText;
			imported = excelToObjects(importText);
			console.log(imported);
		} catch (error) {
			messagesStore('Excel Import Error: ' + error, 'error');
		}
	}
	$: console.log(orderItemProperties);

	$: carriersStore = queryStore({
		client: getContextClient(),
		query: gql`
			query carriers {
				erp_carriers(order_by: { name: desc_nulls_last }) {
					id
					name
					image_url
				}
			}
		`
	});
	$: carriers = $carriersStore?.data?.erp_carriers;
	/* $: shipmentTemplate = {
		carrier: carriers?.[0] || {
			id: null
		},
		expected_delivery_date: new Date().toISOString(),
		tracking: {
			tracking_number: ''
		}
	}; */
	function shipmentTemplate(): Shipment {
		return {
			carrier: {
				id: null
			},
			expected_delivery_date: new Date().toISOString(),
			tracking: {
				tracking_number: ''
			}
		};
	}
	let shipments: Shipment[][] = [];
	$: console.log('shipments', shipments);
	$: console.log('tabState', tabState, openOrderIdx);
	$: console.log('carriers', carriers);

	let allocated = [];
	$: allocatable =
		$jobsStore?.data?.jobs?.filter((v) => allocated.findIndex((a) => a?.id === v?.id && a?.batch === v?.batch) === -1) || [];
	//$: console.log('allocatable', allocatable);
	let allocatableSelectValue;
	let tabState = [true];
	$: openOrderIdx = tabState.findIndex((v) => v);
</script>

<div
	use:filedrop={options}
	on:filedrop={(e) => {
		console.log(e.detail.files);
		console.log('DROP', e);
		files = e.detail.files;
		showImport = files.accepted.length > 0;
		handleDropAsync(e.detail.event);
	}}
/>
<div class="">
	<div class="flex pb-2">
		<div class="ml-auto flex space-x-1">
			<div class="p-1 outline outline-1 rounded outline-gray-400 relative">
				<!-- <Select items={[{ value: null, name: 'N/A' }, ...jobs]} bind:value={job} placeholder="Select job" size="sm" />-->
				<div class="flex max-w-48 overflow-x-auto">
					<div class="absolute -top-3 bg-white dark:bg-slate-600 dark:text-white text-black rounded">
						<p class="text-xs px-0.5">Allocations</p>
					</div>
					<div class="flex gap-x-1">
						<button
							class="my-auto dark:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
							disabled={!allocatableSelectValue}
							on:click={() => {
								if (!allocatableSelectValue) return;
								allocated = [...allocated, allocatableSelectValue];
								allocatableSelectValue = null;
							}}
						>
							<PlusOutline class="outline-none text-gray-600" />
						</button>
						<select
							class="w-fit block text-sm disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded px-0.5 py-0.5"
							bind:value={allocatableSelectValue}
							placeholder={'Select job'}
						>
							<option value={null}> N/A </option>
							{#each allocatable || [] as j}
								<option value={j}>
									{j.id}
									{#if j.batch > 0}
										({String.fromCharCode(64 + j.batch)})
									{/if}
								</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="inline-flex gap-1">
					{#each allocated as j, idx}
						<div>
							<Badge color="dark">
								<p class="text-left">
									{j.id}
									{#if j.batch > 0}
										({String.fromCharCode(64 + j.batch)})
									{/if}
								</p>
								<button
									class="focus:outline-none pl-1"
									on:click={() => {
										allocated = allocated.filter((a, i) => i !== idx);
									}}
								>
									<XMark size="16" class="outline-none" />
								</button>
							</Badge>
						</div>
					{/each}
				</div>
			</div>
			{#if orders.length > 0}
				<Button
					color="blue"
					size="sm"
					on:click={(e) => {
						addOrders();
					}}
				>
					Create {orders.length} orders with {ordersItems.length} lines
				</Button>
			{/if}
		</div>
	</div>
	<div class="flex">
		<div class="flex ml-auto">
			<button
				class="pr-2"
				on:click={(e) => {
					shipments[openOrderIdx] = [...shipments[openOrderIdx], shipmentTemplate()];
				}}
			>
				<PlusOutline class="text-gray-400 hover:text-green-600" />
				<Tooltip placement="left">Add shipment</Tooltip>
			</button>
			<div class="flex gap-x-1">
				{#each shipments?.[openOrderIdx] || [] as shipment, idx}
					<div class="flex text-white bg-slate-500 rounded">
						<p class="my-auto text-center font-semibold w-4">{idx + 1}</p>
						<OrderShipment {shipment} showItems={false} showDetailsModal={true} allowEdit tooltipPlacement="bottom" />
						<button
							class="hover:text-red-600"
							on:click={() => {
								shipments[openOrderIdx] = shipments?.[openOrderIdx].filter((s, i) => i === idx);
							}}
						>
							<XMark size="18" />
						</button>
					</div>
				{/each}
			</div>
		</div>
	</div>
	<div class="pt-6">
		<div class="-mb-12 -ml-6">
			<button
				on:click={(e) => {
					addOrder();
				}}
			>
				<PlusOutline class="text-gray-400 hover:text-green-600" />
				<Tooltip placement="top">Add order</Tooltip>
			</button>
		</div>
		<Tabs style="full" contentClass="px-0 py-4 rounded-lg mt-0">
			{#each orders as order, idx}
				<TabItem
					bind:open={tabState[idx]}
					activeClasses="border-b-8 rounded rounded-lg rounded-full bg-gray-200 border-gray-200 dark:border-gray-700 dark:bg-gray-700"
					inactiveClasses="border hover:border-b-4 rounded rounded-lg rounded-full bg-gray-200 border-gray-200 dark:border-gray-700 dark:bg-gray-700"
				>
					<span slot="title">
						<OrderCreateHeader bind:order />
					</span>
					<OrderCreateMulti
						bind:jobs={allocated}
						bind:shipments={shipments[idx]}
						bind:order
						showHeader={false}
						on:delete={() => removeOrder(idx)}
					/>
				</TabItem>
			{/each}
		</Tabs>
	</div>
</div>

<div class="p-2">
	<div class="p-0 grid grid-cols-2">
		<div class="flex">
			<Toggle color="blue" bind:checked={showImport}>Show import...</Toggle>
			<div class="my-auto ml-2 flex">
				{#if files?.accepted?.[0]}
					<Badge color="green">{files?.accepted?.[0].name}</Badge>
				{/if}
				{#if showImport}
					<div class="float-right">
						<div class="flex">
							<input
								type="number"
								class="block w-10 text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
								bind:value={headerRow}
								on:input={() => {
									imported = excelToObjects(importText);
								}}
							/>
							<input
								type="text"
								class="block w-10 text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
								bind:value={importSeparator}
								on:input={() => {
									imported = excelToObjects(importText);
								}}
							/>
							{#if ['\t'].includes(importSeparator)}
								<p class="-inset-7 text-xs text-gray-500 center">Tab</p>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
		<div class="ml-auto flex">
			{#if showImport}
				<Button
					color="green"
					size="xs"
					disabled={missingImportData.filter((m, idx) => m && imported[idx]?._import)?.length > 0}
					on:click={() => {
						fillOrderFromImport();
					}}
				>
					Import {imported?.filter((i) => i._import)?.length} of {imported?.length} items...
				</Button>
			{/if}
		</div>
	</div>

	{#if showImport}
		<div class="grid grid-cols-2">
			<div>
				<div>
					<textarea
						class="scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-600 scrollbar-thumb-rounded block rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white w-full text-sm"
						placeholder="Import...."
						rows="6"
						wrap="off"
						bind:value={importText}
						on:input={() => {
							imported = excelToObjects(importText);
						}}
					/>
				</div>
				<div class="grid grid-cols-2 gap-2">
					{#each Object.keys(orderItemProperties) as header}
						<div class="flex mt-2">
							<div class="my-auto">
								<p
									class:underline={header !== 'spn'}
									class=" mr-2 w-2/3 text-lg uppercase font-bold dark:text-white text-right"
								>
									{header}
								</p>
							</div>

							<Select
								class="w-1/3"
								items={[{ value: null, name: '' }, ...Object.keys(headers)?.map((h) => ({ value: h, name: h }))]}
								bind:value={orderItemProperties[header]}
							/>
						</div>
					{/each}
				</div>
				{#if missingImportData2.flat(2).includes(true)}
					{@const missingDataImported = missingImportData2
						.map((d, i) => d.flat(2).includes(true) && imported[i]?._import)
						.includes(true)}
					<div class="p-2">
						<Alert class="!items-start" color={missingDataImported ? 'red' : 'green'}>
							<span slot="icon">
								<InfoCircleSolid slot="icon" class="w-4 h-4" />
								<span class="sr-only">Info</span>
							</span>
							<p class="font-medium" class:invisible={!missingDataImported}>
								The below lines have required information missing, fix or remove them from the import:
							</p>
							<ol class="mt-1.5 ml-4 list-decimal list-inside">
								{#each missingImportData2 as missing, idx}
									{#if missing.flat().includes(true)}
										<li class:line-through={!imported[idx]?._import} class:text-gray-500={!imported[idx]?._import}>
											<button
												class="underline"
												on:click={() => {
													document
														.getElementById('importLine' + idx)
														.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
												}}>Line {idx + 1}</button
											> is missing required import data
										</li>
										<ul class="ml-4 list-disc list-inside">
											{#each missing as [isMissing, message]}
												{#if isMissing}
													<li
														class="capitalize"
														class:line-through={!imported[idx]?._import}
														class:text-gray-500={!imported[idx]?._import}
													>
														{message}
													</li>
												{/if}
											{/each}
										</ul>
									{/if}
								{/each}
							</ol>
						</Alert>
					</div>
				{/if}
			</div>
			<div class="max-h-96 overflow-y-auto">
				<Table>
					<TableHead>
						<TableHeadCell padding="px-1 py-1">#</TableHeadCell>
						<TableHeadCell padding="px-1 py-1">Part</TableHeadCell>
						<TableHeadCell padding="px-1 py-1">Qty</TableHeadCell>
						<TableHeadCell padding="px-1 py-1">Unit Price</TableHeadCell>
						<TableHeadCell padding="px-1 py-1">Total Price</TableHeadCell>
						<TableHeadCell padding="px-1 py-1">Supplier</TableHeadCell>
						<TableHeadCell>
							<Checkbox
								checked={true}
								on:change={(e) => {
									imported.forEach((i) => {
										i._import = e?.target?.checked;
									});
									imported = imported;
								}}
							/>
						</TableHeadCell>
					</TableHead>
					<TableBody>
						{#each imported as line, idx}
							{@const quantity = line[orderItemProperties['quantity']]}
							{@const part = line[orderItemProperties['part']]}
							{@const spn = line[orderItemProperties['spn']]}
							{@const price = line[orderItemProperties['price']]}
							{@const supplier = line[orderItemProperties['supplier']]}
							<TableBodyRow
								color={!line._import ? 'yellow' : missingImportData2[idx].flat().includes(true) ? 'red' : 'green'}
							>
								<TableBodyCell tdClass="px-1 py-1 text-xs">{idx + 1}</TableBodyCell>

								<TableBodyCell tdClass="px-1 py-1 text-xs">
									<!-- <p>{part ? part : 'undefined'}</p> -->
									<p id={'importLine' + idx}>
										<EditableText bind:innerText={line[orderItemProperties['part']]}>Test</EditableText>
									</p>
									<p class="text-xs italic">
										<EditableText bind:innerText={line[orderItemProperties['spn']]}>Undefined</EditableText>
									</p>
									<!-- <p class="text-xs italic">{spn}</p> -->
								</TableBodyCell>
								<TableBodyCell tdClass="px-1 py-1 text-xs">
									<EditableText bind:innerText={line[orderItemProperties['quantity']]} />
									<!-- {quantity ? quantity : 'undefined'} -->
								</TableBodyCell>
								<TableBodyCell tdClass="px-1 py-1 text-xs">
									<EditableText bind:innerText={line[orderItemProperties['price']]} />
									<!-- {price ? price : 'undefined'} -->
								</TableBodyCell>
								<TableBodyCell tdClass="px-1 py-1 text-xs">
									{price && quantity ? price * quantity : 'undefined'}
								</TableBodyCell>
								<TableBodyCell tdClass="px-1 py-1 text-xs">
									<EditableText bind:innerText={line[orderItemProperties['supplier']]} />
									<!-- {supplier ? supplier : 'undefined'} -->
								</TableBodyCell>
								<TableBodyCell>
									<Checkbox bind:checked={line._import} />
								</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
					<TableHead>
						<TableHeadCell padding="px-1 py-1">{imported.length}</TableHeadCell>
						<TableHeadCell />
						<TableHeadCell padding="px-1 py-1">
							{imported.reduce((a, v) => a + (v?._import ? Number(v?.[orderItemProperties['quantity']]) : 0), 0)}
						</TableHeadCell>
						<TableHeadCell padding="px-1 py-1">
							{imported.reduce((a, v) => a + (v?._import ? Number(v?.[orderItemProperties['price']]) : 0), 0)}
						</TableHeadCell>
						<TableHeadCell padding="px-1 py-1">
							{imported.reduce(
								(a, v) =>
									a +
									(v?._import
										? Number(v?.[orderItemProperties['price']]) * Number(v?.[orderItemProperties['quantity']])
										: 0),
								0
							)}
						</TableHeadCell>
						<TableHeadCell padding="px-1 py-1">
							{[...new Set(imported.map((i) => i?._import && i?.[orderItemProperties['supplier']]))].filter((i) => i).length}
						</TableHeadCell>
						<TableHeadCell padding="px-1 py-1">
							{imported.filter((v) => v._import).length}
						</TableHeadCell>
					</TableHead>
				</Table>
			</div>
		</div>
	{/if}
</div>
