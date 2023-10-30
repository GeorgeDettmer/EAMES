<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	import { page } from '$app/stores';
	import OrderCreate from '$lib/components/Orders/OrderCreate.svelte';
	import {
		Button,
		Checkbox,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Textarea,
		Toggle
	} from 'flowbite-svelte';

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
		supplier: {
			id: 'FARNELL',
			name: 'Farnell'
		},
		user_id: user.id,
		user: user
	};

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
		console.log('excelToObjects', objects);
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
	let imported: any[] = excelToObjects(importText);
	$: console.log(order);

	function fillOrderFromImport() {
		showImport = false;
		let order_items = [];
		imported.forEach((line) => {
			if (!line?._import) {
				console.log('line skip', line);
				return;
			}
			console.log('line add', line);
			if (line) {
				order_items.push({
					part: line?.['Part Number Description'],
					price: Number(line?.['Unit Price']?.replace(/[^0-9\.-]+/g, '')) || 0,
					quantity: Number(line?.['Qty/Unit']),
					created_at: new Date(),
					user_id: $page?.data?.user?.id
				});
			}
		});
		order.orders_items = order_items;
	}

	function removeFromImport(idx: number) {
		imported = imported.toSpliced(idx, 1);
	}
</script>

<OrderCreate {order} />
<div class="p-2">
	<div class="p-2 grid grid-cols-2">
		<Toggle color="blue" bind:checked={showImport}>Show import...</Toggle>
		<div class="ml-auto">
			<Button
				color="green"
				size="xs"
				on:click={() => {
					fillOrderFromImport();
				}}>Import...</Button
			>
		</div>
	</div>

	{#if showImport}
		<div class="grid grid-cols-2">
			<Textarea
				id="po-paste"
				placeholder="Paste PO details here"
				rows="6"
				name="message"
				bind:value={importText}
				on:change={() => {
					imported = excelToObjects(importText);
					console.log('import:', imported);
				}}
			/>
			<Table>
				<TableHead>
					<TableHeadCell>#</TableHeadCell>
					<TableHeadCell>Qty</TableHeadCell>
					<TableHeadCell>Part</TableHeadCell>
					<TableHeadCell>Unit Price</TableHeadCell>
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
						<TableBodyRow>
							<TableBodyCell>{idx + 1}</TableBodyCell>
							<TableBodyCell>{line['Qty/Unit']}</TableBodyCell>
							<TableBodyCell>{line['Part Number Description']}</TableBodyCell>
							<TableBodyCell>{line['Unit Price']}</TableBodyCell>
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
