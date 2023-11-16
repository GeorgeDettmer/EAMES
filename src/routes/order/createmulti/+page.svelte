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
		Dropdown,
		DropdownItem,
		Label,
		Select,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Textarea,
		Toggle
	} from 'flowbite-svelte';
	import { messagesStore } from 'svelte-legos';
	import { InfoCircleSolid, PlusOutline } from 'flowbite-svelte-icons';
	import { getContextClient, gql, queryStore, subscriptionStore } from '@urql/svelte';
	import OrderCreateHeader from '$lib/components/Orders/OrderCreateHeader.svelte';
	import { goto } from '$app/navigation';
	import { carrier_urls } from '$lib/utils';

	$: user = {
		id: $page?.data?.user?.id,
		username: $page?.data?.user?.username,
		first_name: $page?.data?.user?.firstname,
		last_name: $page?.data?.user?.lastname,
		initials: $page?.data?.user?.initials,
		color: $page?.data?.user?.color
	};

	/* $: order = {
		orders_items: [],
		supplier: {},
		user_id: user.id,
		user
	}; */
	let headers = {};
	function excelToObjects(stringData) {
		let objects = [];
		//split into rows
		let rows = stringData.split('\n');

		//Make columns
		let columns = rows[0].split('\t');

		//Note how we start at rowNr = 1, because 0 is the column row
		for (let rowNr = 1; rowNr < rows.length; rowNr++) {
			let o = {};
			let data = rows[rowNr].split('\t');
			if (rows[rowNr] && data) {
				//Loop through all the data
				for (let cellNr = 0; cellNr < data.length; cellNr++) {
					o[columns[cellNr]] = data[cellNr];
				}
				o._import = true;
				objects.push(o);
			}
		}
		//console.log('parsedObjects:', objects);
		headers = {};
		objects
			?.map((l) => Object.keys(l))
			?.flat()
			?.forEach((h) => {
				if (h?.[0] && h?.[0] !== '_') {
					headers[h] = '';
				}
			});
		//console.log('headers', headers);

		return objects;
	}

	let importText: string = '';
	let showImport: boolean = false;
	let imported: any[] = []; //excelToObjects(importText).filter((line) => line?.['Part Number Description'] && line?.['Qty/Unit']);

	function fillOrderFromImport() {
		let toImport = imported?.filter((l) => l?._import !== false);
		console.log('toImport', toImport, imported);
		let importSuppliers = new Set(toImport?.map((l) => l?.[orderItemProperties['supplier']]));
		let importSuppliersExist = [...importSuppliers].every((is) => suppliersNames.flat().includes(is.toLowerCase()));
		if (!importSuppliersExist) {
			messagesStore(
				`One or more suppliers in the import do not exist in the suppliers library. Suppliers: ${[
					...importSuppliers.values()
				]}`
			);
			return;
		}
		/* if (importSuppliers.size > 1) {
			messagesStore(
				`Currently only import for 1 supplier at a time is supported. Suppliers: ${[...importSuppliers.values()]}`
			);
			return;
		} */
		showImport = false;
		let order = {};
		let order_items = [];
		let importOrders = {};
		toImport.forEach((line, idx) => {
			//console.log('line add', line);
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
					messagesStore(`Line ${idx + 1} has 0 price`);
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
				importOrders[importSuppierName].orders_items = [
					...importOrders[importSuppierName].orders_items,
					{
						part,
						spn,
						price,
						quantity: quantity,
						created_at: new Date(),
						user_id: $page?.data?.user?.id,
						tracking: []
					}
				];
				/* order_items.push({
					part,
					spn,
					price,
					quantity: quantity,
					created_at: new Date(),
					user_id: $page?.data?.user?.id
				}); */
			}
		});
		console.log('importOrders', importOrders, Object.values(importOrders));
		orders = Object.values(importOrders);
		/* let importSuppierName = toImport?.[0]?.[orderItemProperties['supplier']];
		let importSupplier = suppliers?.filter((s) => s.names?.includes(importSuppierName?.toLowerCase()))?.[0];
		selectedSupplierId = importSupplier?.id;
		order.user = $page?.data?.user;
		order.supplier_id = selectedSupplierId;
		order.supplier.id = importSupplier?.id;
		order.supplier.name = importSupplier?.name;
		order.supplier.names = importSupplier?.names;
		order.orders_items = order_items; */
	}

	let orderItemProperties = {
		part: 'MPN',
		quantity: 'Order',
		price: 'Unit(£)',
		spn: 'Purchased Part',
		supplier: 'Supplier'
	};

	$: missingImportData = imported?.map(
		(i) => ['part', 'quantity', 'price'].filter((k) => !i?.[orderItemProperties[k]])?.length !== 0
	);

	$: jobsStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription order {
				jobs(order_by: { id: desc }) {
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
			return { value: j, name: `${j.id} (${j.batch})` };
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
	$: suppliersNames = suppliers?.map((s) => s.names);
	/* $: {
		if (!selectedSupplierId && suppliers) {
			selectedSupplierId = suppliers?.[0]?.id;
			order.supplier_id = selectedSupplierId;
			order.supplier.id = selectedSupplierId;
			order.supplier.name = suppliers?.[0]?.name;
			order.supplier.names = suppliers?.[0]?.names;
		}
	} */
	let selectedSupplierId = undefined;

	let orders = [
		/* {
			orders_items: [],
			supplier: {},
			user_id: user?.id,
			user
		},
		{
			orders_items: [],
			supplier: {},
			user_id: user?.id,
			user
		} */
	];

	/* $: {
		if (suppliers?.length > 0) {
			orders[0].supplier = suppliers[0];
		}
	} */
	$: console.log('PAGE ORDERS:', orders);

	$: {
		if (!$suppliersStore.fetching) {
			addOrder();
		}
	}

	$: ordersItems = orders?.flatMap((o) => o.orders_items) || [];

	function addOrder(force: boolean = true) {
		let supplier = Object.assign({}, suppliers?.[0] || {});
		orders = [
			...orders,
			{
				orders_items: [],
				/* supplier_id: 'FARNELL', */
				tracking: [],
				supplier: supplier,
				user_id: user?.id,
				user
			}
		];
	}

	const urqlClient = getContextClient();
	let ordersAdding = false;
	async function addOrders() {
		if (ordersAdding) return;
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
			return;
		}
		if (orders.length === 0) {
			messagesStore('No orders to create', 'error');
			return;
		}
		if (ordersItems.length === 0) {
			messagesStore('There must be some order items to submit an order', 'error');
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

		ordersAdding = true;
		let mutationResult;
		console.log('addOrders', orders);
		let objects = orders.map((o) => {
			let obj = {
				supplier_id: o.supplier.id,
				user_id: $page?.data?.user?.id
			};

			let items = o.orders_items;
			/* items.forEach((i) => {
				if (!i?.tracking) {
					if (carrier_urls?.[orderTracking?.carrier_code]) {
						orderTracking.tracking_url = carrier_urls?.[orderTracking?.carrier_code](orderTracking?.tracking_number);
					}
					i.tracking = [orderTracking];
				} else {
					i?.tracking?.map((t) => {
						if (carrier_urls?.[orderTracking?.carrier_code]) {
							t.tracking_url = carrier_urls?.[t?.carrier_code](t?.tracking_number);
						}
					});
				}
				console.log('tracking set:', i?.tracking);
			}); */

			obj.orders_items = {
				data: items
			};

			if (job?.id) {
				obj.jobs_orders = {
					data: [
						{
							job_id: job.id
						}
					]
				};
			}

			return obj;
		});

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
			goto('/order?me');
		}
		ordersAdding = false;
	}

	//$: tabsState = orders.map((o, idx) => idx === 0);
	let openOrderIdx = 0;
	let jobListVisible = true;
</script>

<div class="">
	<div class="flex">
		<div class="-mb-8 -ml-10 -mt-2">
			<Button
				on:click={(e) => {
					addOrder();
				}}
			>
				<PlusOutline />
			</Button>
		</div>
		<div class="-mb-8 ml-auto space-y-1">
			<div class="mx-auto">
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
			<Select items={[{ value: null, name: 'N/A' }, ...jobs]} bind:value={job} placeholder="Select job" size="sm" />
		</div>
	</div>

	<div>
		{#if orders.length === 0}
			<div class="mx-auto mt-10">
				<p>No orders...</p>
			</div>
		{:else}
			<Tabs
				style="underline"
				divider
				defaultClass="flex flex-wrap space-x-1"
				contentClass="p-4 rounded-lg mt-0"
				activeClasses="p-0 text-primary-600 rounded-t-lg dark:bg-gray-800 dark:text-primary-500"
				inactiveClasses="p-0 text-gray-500 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
			>
				{#each orders as order, idx}
					<TabItem open={openOrderIdx === idx}>
						<span slot="title">
							<OrderCreateHeader bind:order />
						</span>
						<OrderCreateMulti bind:order showHeader={false} />
					</TabItem>
				{/each}
			</Tabs>
		{/if}
	</div>
</div>

<div class="p-2">
	<div class="p-2 grid grid-cols-2">
		<Toggle color="blue" bind:checked={showImport}>Show import...</Toggle>

		<div class="ml-auto flex">
			{#if showImport}
				<Button
					color="green"
					size="xs"
					disabled={missingImportData.filter((m, idx) => m && imported[idx]?._import)?.length > 0}
					on:click={() => {
						fillOrderFromImport();
					}}>Import {imported?.filter((i) => i._import)?.length} of {imported?.length} items...</Button
				>
			{/if}
		</div>
	</div>

	{#if showImport}
		<div class="grid grid-cols-2">
			<div>
				<Textarea
					id="po-paste"
					placeholder="Import...."
					rows="6"
					name="message"
					bind:value={importText}
					on:change={() => {
						imported = excelToObjects(importText);
						//console.log('import:', imported);
					}}
				/>
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
				{#if missingImportData.includes(true)}
					<div class="p-2">
						<Alert class="!items-start" color="red">
							<span slot="icon">
								<InfoCircleSolid slot="icon" class="w-4 h-4" />
								<span class="sr-only">Info</span>
							</span>
							<p class="font-medium">
								Ensure that the below lines have part, quantity and price defined or remove them from the import:
							</p>
							<ul class="mt-1.5 ml-4 list-disc list-inside">
								{#each missingImportData as missing, idx}
									{#if missing}
										<li class:line-through={!imported[idx]?._import}>Line {idx + 1} is missing required import data</li>
									{/if}
								{/each}
							</ul>
						</Alert>
					</div>
				{/if}
			</div>
			<Table>
				<TableHead>
					<TableHeadCell>#</TableHeadCell>
					<TableHeadCell>Qty</TableHeadCell>
					<TableHeadCell>Part</TableHeadCell>
					<TableHeadCell>Unit Price</TableHeadCell>
					<TableHeadCell>Supplier</TableHeadCell>
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
						<TableBodyRow color={!line._import ? 'yellow' : !quantity || !part || !price ? 'red' : 'green'}>
							<TableBodyCell>{idx + 1}</TableBodyCell>
							<TableBodyCell>{quantity ? quantity : 'undefined'}</TableBodyCell>
							<TableBodyCell>
								<div>
									<p>{part ? part : 'undefined'}</p>
									{#if spn}
										<p class="text-xs italic">{spn}</p>
									{/if}
								</div>
							</TableBodyCell>
							<TableBodyCell>{price ? price : 'undefined'}</TableBodyCell>
							<TableBodyCell>{supplier ? supplier : 'undefined'}</TableBodyCell>
							<TableBodyCell>
								<Checkbox bind:checked={line._import} />
							</TableBodyCell>
						</TableBodyRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	{/if}
</div>
