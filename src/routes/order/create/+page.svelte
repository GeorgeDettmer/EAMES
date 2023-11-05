<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	import { page } from '$app/stores';
	import OrderCreate from '$lib/components/Orders/OrderCreate.svelte';
	import {
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
	import { quadInOut } from 'svelte/easing';

	$: user = {
		id: $page?.data?.user?.id,
		username: $page?.data?.user?.username,
		first_name: $page?.data?.user?.firstname,
		last_name: $page?.data?.user?.lastname,
		initials: $page?.data?.user?.initials,
		color: $page?.data?.user?.color
	};

	$: order = {
		orders_items: [],
		/* supplier_id: 'FARNELL', */
		supplier: {},
		user_id: user.id,
		user
	};
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
		console.log('parsedObjects:', objects);
		headers = {};
		objects
			?.map((l) => Object.keys(l))
			?.flat()
			?.forEach((h) => {
				if (h?.[0] && h?.[0] !== '_') {
					headers[h] = '';
				}
			});
		console.log('headers', headers);

		return objects;
	}

	let importText: string = ''; /* `Item	Qty/Unit	Part Number Description	Delivery Date	Unit Price	Ext Price
1	110	3582887	ASAP	£0.14	£15.84
2	90	3582814	ASAP	£0.00	£0.44
3	70	3581351	ASAP	£0.03	£1.79
4	90	1414581	ASAP	£0.01	£0.88
5	70	2525047	ASAP	£0.02	£1.58
7	90	1800798	ASAP	£0.01	£0.88
8	30	2774580	ASAP	£0.07	£2.05
12	30	3405200	ASAP	£0.32	£9.63
13	110	1469683	ASAP	£0.00	£0.39
15	60	1469793	ASAP	£0.01	£0.60
16	70	2563621	ASAP	£0.04	£2.58
18	70	2838469	ASAP	£0.08	£5.32
`; */
	let showImport: boolean = false;
	let imported: any[] = []; //excelToObjects(importText).filter((line) => line?.['Part Number Description'] && line?.['Qty/Unit']);
	$: console.log(order);

	function fillOrderFromImport() {
		let toImport = imported?.filter((l) => l?._import !== false);
		console.log('toImport', toImport, imported);
		let importSuppliers = new Set(toImport?.map((l) => l?.[orderItemProperties['supplier']]));
		if (importSuppliers.size > 1) {
			messagesStore(
				`Currently only import for 1 supplier at a time is supported. Suppliers: ${[...importSuppliers.values()]}`
			);
			return;
		}
		showImport = false;
		let order_items = [];
		toImport.forEach((line, idx) => {
			//console.log('line add', line);
			if (line) {
				let part = line?.[orderItemProperties['part']];
				let spn = line?.[orderItemProperties['spn']];
				let price = Number(line?.[orderItemProperties['price']]?.replace(/[^0-9\.-]+/g, '')) || 0;
				let quantity = Number(line?.[orderItemProperties['quantity']]);
				console.log({ part, spn, price, quantity });
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
				order_items.push({
					part,
					spn,
					price,
					quantity: quantity,
					created_at: new Date(),
					user_id: $page?.data?.user?.id
				});
			}
		});
		order.supplier.name = toImport?.[0]?.[orderItemProperties['supplier']];
		order.orders_items = order_items;
	}

	function removeFromImport(idx: number) {
		imported = imported.toSpliced(idx, 1);
	}

	$: console.log('headers:', orderItemProperties);

	let orderItemProperties = {
		part: 'MPN',
		quantity: 'Order',
		price: 'Unit(£)',
		spn: 'Purchased Part',
		supplier: 'Supplier'
	};
</script>

<OrderCreate {order} />
<div class="p-2">
	<div class="p-2 grid grid-cols-2">
		<Toggle color="blue" bind:checked={showImport}>Show import...</Toggle>

		<div class="ml-auto">
			{#if showImport}
				<Button
					color="green"
					size="xs"
					on:click={() => {
						fillOrderFromImport();
					}}>Import...</Button
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
						console.log('import:', imported);
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
