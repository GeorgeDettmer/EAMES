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
		Textarea,
		Toggle,
		Badge,
		Label,
		Tooltip
	} from 'flowbite-svelte';
	import { messagesStore } from 'svelte-legos';
	import { EditOutline, InfoCircleSolid, PlusOutline } from 'flowbite-svelte-icons';
	import { getContextClient, gql, queryStore, subscriptionStore } from '@urql/svelte';
	import OrderCreateHeader from '$lib/components/Orders/OrderCreateHeader.svelte';
	import { goto } from '$app/navigation';
	import { filedrop, type FileDropOptions, type Files } from 'filedrop-svelte';
	import XLSX from 'xlsx';
	import { getParameterInsensitiveAny } from '$lib/utils';
	import { windowTitleStore } from '$lib/stores';
	import { onDestroy } from 'svelte';
	import EditableText from '$lib/components/Misc/EditableText.svelte';

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
						tracking: [
							{
								tracking_number: '',
								tracking_url: '',
								carrier_code: ''
							}
						],
						category: 'Component'
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
			() => [
				//suppliersNames.filter((n) => n.toLowerCase() === i?.[orderItemProperties['supplier']]?.toLowerCase()).length === 0,
				suppliersNames.every((n) => n !== i?.[orderItemProperties['supplier']]?.toLowerCase()),
				'Supplier invalid'
			]
		].map((check) => check())
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
	$: suppliersNames = suppliers?.flatMap((s) => s.names)?.map((n) => n?.toLowerCase());
	$: console.log('suppliersNames', suppliersNames);
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

	$: ordersItems = orders?.flatMap((o) => o?.orders_items) || [];

	function addOrder(force: boolean = true) {
		let supplier = Object.assign({}, suppliers?.[0] || {});
		/* orders = [
			...orders,
			{
				orders_items: [],
				tracking: [],
				supplier: supplier,
				user_id: user?.id,
				user
			}
		]; */
	}

	function removeOrder(idx: number) {
		orders = orders.filter((o, i) => i !== idx);
	}

	const urqlClient = getContextClient();
	let ordersAdding = false;
	async function addOrders() {
		console.log(Number($page?.data?.orderId));
		if (!Number($page?.data?.orderId)) return;
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
		if (orders.length === 0 || orders.length > 1) {
			messagesStore('No orders to create' + orders.length, 'error');
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
		console.log('addOrders', orders);
		let objects = orders[0].orders_items.map((oi) => {
			return { ...oi, order_id: Number($page?.data?.orderId) };
		});
		mutationResult = await urqlClient.mutation(
			gql`
				mutation deleteOrdersItems($orderId: bigint) {
					delete_erp_orders_items(where: { order_id: { _eq: $orderId } }) {
						affected_rows
					}
				}
			`,
			{
				orderId: Number($page?.data?.orderId)
			}
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		}
		mutationResult = await urqlClient.mutation(
			gql`
				mutation addOrdersItems($objects: [erp_orders_items_insert_input!] = []) {
					insert_erp_orders_items(objects: $objects) {
						returning {
							id
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
			messagesStore(
				'Inserted order(s): ' + mutationResult?.data?.insert_erp_orders_items?.returning?.map((r) => r.id),
				'success'
			);
			//goto('/order');
		}
		console.log(objects);
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
	<div class="flex">
		<div class="-mb-8 -ml-10 -mt-2">
			<Button
				on:click={(e) => {
					addOrder();
				}}
			>
				<PlusOutline class="text-gray-400" />
			</Button>
			<Tooltip placement="right">Add order</Tooltip>
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
			<!-- <Tabs
				style="pill"
				divider
				defaultClass="flex flex-wrap space-x-1"
				contentClass="p-4 rounded-lg mt-0"
				activeClasses="p-0 text-primary-600 rounded-t-lg dark:bg-gray-800 dark:text-primary-500"
				inactiveClasses="p-0 text-gray-500 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
			> -->
			<Tabs style="full" contentClass="px-0 py-4 rounded-lg mt-0">
				{#each orders as order, idx}
					<TabItem
						open={openOrderIdx === idx}
						activeClasses="border-b-8 rounded rounded-lg rounded-full bg-gray-200 border-gray-200 dark:border-gray-700 dark:bg-gray-700"
						inactiveClasses="border-b-4 border-opacity-20 border-b-gray-500 rounded-lg rounded-full dark:border-gray-700 hover:dark:bg-gray-700"
					>
						<span slot="title">
							<OrderCreateHeader bind:order />
						</span>
						<OrderCreateMulti bind:order showHeader={false} on:delete={() => removeOrder(idx)} />
					</TabItem>
				{/each}
			</Tabs>
		{/if}
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
					<div class="p-2">
						<Alert class="!items-start" color="red">
							<span slot="icon">
								<InfoCircleSolid slot="icon" class="w-4 h-4" />
								<span class="sr-only">Info</span>
							</span>
							<p class="font-medium">
								The below lines have required information missing, fix or remove them from the import:
							</p>
							<ol class="mt-1.5 ml-4 list-decimal list-inside">
								{#each missingImportData2 as missing, idx}
									{#if missing.flat().includes(true)}
										<li class:line-through={!imported[idx]?._import} class:text-gray-500={!imported[idx]?._import}>
											Line {idx + 1} is missing required import data
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
						<TableBodyRow color={!line._import ? 'yellow' : missingImportData2[idx].flat().includes(true) ? 'red' : 'green'}>
							<TableBodyCell tdClass="px-1 py-1 text-xs">{idx + 1}</TableBodyCell>

							<TableBodyCell tdClass="px-1 py-1 text-xs">
								<!-- <p>{part ? part : 'undefined'}</p> -->
								<p>
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
								(v?._import ? Number(v?.[orderItemProperties['price']]) * Number(v?.[orderItemProperties['quantity']]) : 0),
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
	{/if}
</div>
