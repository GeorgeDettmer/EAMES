<script lang="ts">
	import { queryStore, getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import {
		Label,
		Input,
		Select,
		Badge,
		Modal,
		Button,
		Toggle,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { messagesStore } from 'svelte-legos';
	import AddAssembly from './AddAssembly.svelte';
	import { Plus, PlusCircle } from 'svelte-heros-v2';
	import AddCustomer from './AddCustomer.svelte';
	import { datetimeFormat, numberToLetter } from '$lib/utils';
	const urqlClient = getContextClient();
	$: lastJobIdStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription order {
				jobs(limit: 1, order_by: { id: desc }) {
					id
				}
			}
		`
	});
	$: nextId = $lastJobIdStore?.data?.jobs?.[0]?.id + 1;

	$: customersStore = queryStore({
		client: getContextClient(),
		query: gql`
			query customers {
				customers(order_by: { name: asc }) {
					id
					name
					active
					jobs_aggregate {
						aggregate {
							count
						}
					}
					jobs(distinct_on: assembly_id) {
						id
						batch
						assembly {
							id
							name
							revision_external
							bom {
								id
								revision_external
								revision_internal
								lines_aggregate(where: { part: { _is_null: false } }) {
									aggregate {
										count(columns: part, distinct: true)
									}
								}
							}
						}
					}
				}
			}
		`,
		requestPolicy: 'cache-and-network'
	});
	$: customers = $customersStore?.data?.customers?.map((c) => {
		return { value: c, name: c.name };
	});

	$: assembliesStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription assemblies {
				assemblies(order_by: { name: asc }) {
					id
					name
					revision_external
					revision_internal
					assemblies_cad {
						revision_external
						revision_internal
					}
					bom {
						revision_external
						revision_internal
					}
				}
			}
		`
	});

	let id;
	let batch;
	let customer;
	let quantity = 1;
	let assembly;
	let shipDate;
	let deliveryDate = new Date()?.toISOString()?.split('T')?.[0];
	let dueDate = new Date()?.toISOString()?.split('T')?.[0];
	let leadTime = 1;
	let createKit = true;

	let createAssemblyVisible = false;
	let createCustomerVisible = false;

	$: assemblies = $assembliesStore?.data?.assemblies?.map((assembly) => {
		return {
			value: assembly,
			name: `${assembly?.name} (${assembly?.revision_external || '-'}|${assembly?.bom?.revision_external || '-'}|${
				assembly?.assemblies_cad?.revision_external || '-'
			})`
		};
	});

	let jobAdding = false;
	async function addJob() {
		if (jobAdding) return;
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
			return;
		}
		if (!customer?.id || !quantity) {
			messagesStore('customer & quantity must be set', 'warning');
			return;
		}
		if (batches.length > 0) {
			if (batches.length < 2) {
				messagesStore('If setting batches there must be more than 1!', 'warning');
				return;
			}
			if (batchesTotalQuantity !== Number(quantity)) {
				messagesStore('Total quantity of batches does not equal the overall job quantity', 'warning');
				return;
			}
		}

		jobAdding = true;
		let mutationResult;

		let jobObject = {
			id: id || nextId,
			batch: 0,
			quantity,
			customer_id: customer?.id,
			assembly_id: assembly?.id,
			due_date: dueDate
		};

		let insertObjects = [jobObject];

		if (batches.length > 0) {
			jobObject.due_date = new Date(batches[batches.length - 1].dueDate).toISOString();
			insertObjects = [
				jobObject,
				...batches.map((b, idx) => {
					return {
						id: jobObject.id,
						batch: idx + 1,
						quantity: b.quantity,
						customer_id: customer?.id,
						assembly_id: assembly?.id,
						reference: b.reference,
						due_date: b.dueDate
					};
				})
			];
		}
		mutationResult = await urqlClient.mutation(
			gql`
				mutation insertJob($objects: [jobs_insert_input!] = {}) {
					insert_jobs(objects: $objects) {
						affected_rows
						returning {
							id
							batch
						}
					}
				}
			`,
			{ objects: insertObjects }
		);
		/* mutationResult = await urqlClient.mutation(
			gql`
				mutation insertJob($id: bigint!, $customer_id: bigint!, $batch: Int = 0, $quantity: Int, $assembly_id: bigint) {
					insert_jobs_one(
						object: { id: $id, customer_id: $customer_id, batch: $batch, quantity: $quantity, assembly_id: $assembly_id }
					) {
						id
						batch
					}
				}
			`,
			{ id: id || nextId, batch, quantity, customer_id: customer.id, assembly_id: assembly.id }
		); */
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore(
				'Inserted job: ' + mutationResult.data.insert_jobs.returning.map((j) => `${j.id}-${j.batch}`),
				'success'
			);
			id = undefined;
			quantity = 1;
			customer = undefined;
			assembly = undefined;
			batches = [];
		}

		jobAdding = false;
	}

	//TODO: Expand....
	/* let customerOrderItems = [];
	let quotedItems = [];
	let typeOptions = [{ id: 'LABOUR' }, { id: 'MATERIAL' }, { id: 'OTHER' }];
	$: unitTotalQuoted = quotedItems.reduce((a, v) => a + Number(v.cost), 0);
	$: unitTotalPaid = customerOrderItems.reduce((a, v) => a + Number(v.cost), 0);

	$: totalPaid = customerOrderItems.reduce((a, v) => a + Number(v.cost) * Number(v.quantity), 0);
	$: totalQuoted = quotedItems.reduce((a, v) => a + Number(v.cost) * Number(v.quantity), 0);

	$: fullyPaid = totalPaid === totalQuoted; */

	interface Batch {
		id: number;
		batch?: number;
		quantity: number;
		reference: string;
		dueDate: string;
	}
	let batches: Batch[] = [];
	$: batchesTotalQuantity = batches.reduce((a, v) => Number(a) + Number(v.quantity), 0);
	$: console.log('batches', batches, batchesTotalQuantity);
</script>

<div class="w-2/3 mx-auto">
	<div class="grid md:grid-cols-2 gap-2 gap-y-1">
		<div class="flex">
			<div class="w-2/3">
				<Label>Job</Label>
				<Input placeholder={nextId} type="number" bind:value={id} />
			</div>
			<div class="w-1/3">
				<!-- <Label>Batch</Label>
				<Input placeholder={null} type="number" bind:value={batch} /> -->
			</div>
		</div>
		<div class="flex gap-x-2">
			<div
				class="w-1/2"
				on:mousewheel={(e) => {
					quantity = Math.max(Number(quantity) + (e.deltaY > 0 ? -1 : +1), 1);
				}}
			>
				<Label>Quantity</Label>
				<Input placeholder={1} type="number" bind:value={quantity} />
			</div>
			<div class="w-1/2">
				<!-- <Label>Lead time</Label>
				<Input placeholder={1} type="number" bind:value={leadTime} /> -->
			</div>
		</div>
		<div class="">
			<Label>Customer</Label>

			<div class="flex">
				<Select items={customers} bind:value={customer} placeholder="Select customer" />
				<div class="ml-1 my-auto">
					<span
						class="hover:text-green-500 cursor-pointer"
						class:text-green-500={createCustomerVisible}
						on:click={() => (createCustomerVisible = true)}
					>
						<PlusCircle />
					</span>
				</div>
			</div>
		</div>
		<div class="flex gap-x-2">
			<div class="w-1/2">
				<Label>Due date</Label>
				<Input type="date" bind:value={shipDate} />
			</div>
			<!-- <div class="w-1/2">
				<Label>Ship date</Label>
				<Input
					type="date"
					on:change={() => {
						if (!deliveryDate) {
							deliveryDate = shipDate;
						}
					}}
					bind:value={shipDate}
				/>
			</div> 
			 <div class="w-1/2">
				<Label>Delivery date</Label>
				{#if batches.length}
					<Input
						type="date"
						on:change={() => {}}
						value={new Date(Math.max(...batches.map((b) => new Date(b?.dueDate).getTime() / 1000))).getDate()}
						disabled
					/>
				{:else}
					<Input type="date" on:change={() => {}} bind:value={deliveryDate} />
				{/if}
			</div> -->
		</div>

		<div class="my-auto pt-4">
			{#if customer?.jobs_aggregate?.aggregate?.count}
				<Badge color="blue" large>{customer?.jobs_aggregate?.aggregate?.count}</Badge>
			{/if}
		</div>

		<div />

		<div>
			<div class="">
				<Label>Assemblies</Label>
				{#if assemblies}
					<div class="flex">
						<Select items={assemblies} bind:value={assembly} placeholder="Select assembly" />
						<div class="ml-1 my-auto">
							<span
								class="hover:text-green-500 cursor-pointer"
								class:text-green-500={createAssemblyVisible}
								on:click={() => (createAssemblyVisible = true)}
							>
								<PlusCircle />
							</span>
						</div>
					</div>
				{:else}
					<Input type="text" />
				{/if}
			</div>
		</div>
		<div class="my-auto pt-4">
			{#if assembly}
				{#if assembly?.bom?.lines_aggregate?.aggregate?.count}
					<Badge color="blue" large>{assembly?.bom?.lines_aggregate?.aggregate?.count}</Badge>
				{/if}
			{/if}
		</div>
	</div>

	<div class="mt-2">
		<Table hoverable>
			<TableHead>
				<TableHeadCell padding="px-1 pt-2" colspan="6">BATCHES</TableHeadCell>
			</TableHead>
			<TableHead>
				<TableHeadCell padding="px-4 py-2">#</TableHeadCell>
				<TableHeadCell padding="px-4 py-2">Batch</TableHeadCell>
				<TableHeadCell padding="px-4 py-2">Reference</TableHeadCell>
				<TableHeadCell padding="px-4 py-2">Quantity</TableHeadCell>
				<TableHeadCell padding="px-4 py-2">Due Date</TableHeadCell>
				<TableHeadCell padding="px-4 py-2" />
			</TableHead>
			<TableBody>
				<TableBodyRow color="blue">
					<TableBodyCell tdClass="px-4 py-2 whitespace-nowrap font-medium">
						{0}
					</TableBodyCell>
					<TableBodyCell tdClass="px-4 py-2 whitespace-nowrap font-medium">
						{'-'}
					</TableBodyCell>
					<TableBodyCell tdClass="px-4 py-2 min-w-36 whitespace-nowrap font-medium">
						{'-'}
					</TableBodyCell>
					<TableBodyCell tdClass="px-4 py-2 whitespace-nowrap font-medium">
						{quantity}
					</TableBodyCell>
					<TableBodyCell tdClass="px-4 py-2 whitespace-nowrap font-medium">
						{datetimeFormat(deliveryDate, false)}
					</TableBodyCell>
					<TableBodyCell tdClass="px-4 py-2 whitespace-nowrap font-medium" />
				</TableBodyRow>
				{#each batches as batch, idx}
					<TableBodyRow
						color={batch?.quantity < 1 || batches.length < 2 || batchesTotalQuantity !== Number(quantity)
							? 'red'
							: 'default'}
					>
						<TableBodyCell tdClass="px-4 py-2 whitespace-nowrap font-medium">
							{idx + 1}
						</TableBodyCell>
						<TableBodyCell tdClass="px-4 py-2 whitespace-nowrap font-medium">
							<div class="flex gap-x-1">
								<p>{numberToLetter(idx + 1, 64)}</p>
							</div>
						</TableBodyCell>
						<TableBodyCell tdClass="px-4 py-2 min-w-48 whitespace-nowrap font-medium">
							<Input size="sm" bind:value={batch.reference} placeholder="Reference" />
						</TableBodyCell>
						<TableBodyCell tdClass="px-4 py-2 whitespace-nowrap font-medium">
							<Input size="sm" type="number" min="1" bind:value={batch.quantity} />
						</TableBodyCell>
						<TableBodyCell tdClass="px-4 py-2 whitespace-nowrap font-medium">
							<Input size="sm" type="date" bind:value={batch.dueDate} />
						</TableBodyCell>
						<TableBodyCell tdClass="px-4 py-2 whitespace-nowrap font-medium">
							<button
								class="cursor-pointer"
								on:click={() => {
									batches = batches.filter((_, i) => i !== idx);
								}}
							>
								❌
							</button>
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
			<TableHead>
				<TableHeadCell padding="px-4 py-2">{batches.length}</TableHeadCell>
				<TableHeadCell padding="px-4 py-2" />
				<TableHeadCell padding="px-4 py-2" />
				<TableHeadCell padding="px-4 py-2">{batches.reduce((a, v) => a + Number(v.quantity), 0)}</TableHeadCell>
				<TableHeadCell padding="px-4 py-2" />
				<TableHeadCell padding="px-4 py-2">
					<button
						class="disabled:hover:text-red-500 disabled:cursor-not-allowed hover:text-green-600 cursor-pointer"
						disabled={quantity < 2 || quantity - batchesTotalQuantity < 1}
						on:click={() => {
							let q = Number(quantity);
							if (q - batchesTotalQuantity < 1) return;
							if (batches.length === 0) {
								batches = [
									{
										id,
										quantity: q % 2 === 0 ? q / 2 : (q - 1) / 2,
										reference: '',
										dueDate: new Date()?.toISOString()?.split('T')?.[0]
									},
									{
										id,
										quantity: q % 2 === 0 ? q / 2 : (q + 1) / 2,
										reference: '',
										dueDate: new Date()?.toISOString()?.split('T')?.[0]
									}
								];
								return;
							}
							batches = [
								...batches,
								{
									id,
									quantity: q - batchesTotalQuantity,
									reference: '',
									dueDate: new Date()?.toISOString()?.split('T')?.[0]
								}
							];
						}}
					>
						<Plus size="22" />
					</button>
				</TableHeadCell>
			</TableHead>
		</Table>
	</div>

	<!-- <div class="mt-8">
		<Table hoverable>
			<TableHead>
				<TableHeadCell padding="px-1 pt-2" colspan="7">Quoted</TableHeadCell>
			</TableHead>
			<TableHead>
				<TableHeadCell>#</TableHeadCell>
				<TableHeadCell>Description</TableHeadCell>
				<TableHeadCell>Type</TableHeadCell>
				<TableHeadCell>Quantity</TableHeadCell>
				<TableHeadCell>Unit Cost</TableHeadCell>
				<TableHeadCell>Total Cost</TableHeadCell>
				<TableHeadCell />
			</TableHead>
			<TableBody>
				{#each quotedItems as item, idx}
					<TableBodyRow
						class={`cursor-pointer`}
						on:click={() => {
							//goto('/kitting/' + job.id);
						}}
					>
						<TableBodyCell>
							{idx + 1}
						</TableBodyCell>
						

						<TableBodyCellEditable bind:value={item.description}>
							{item.description || '--------------'}
						</TableBodyCellEditable>
						<TableBodyCellEditable bind:value={item.type} inputType="dropdown" options={typeOptions}>
							{item.type}
						</TableBodyCellEditable>
						<TableBodyCellEditable bind:value={item.quantity} inputType="number">
							<Badge color={Number(item.quantity) !== Number(quantity) ? 'blue' : 'green'}>{item.quantity}</Badge>
						</TableBodyCellEditable>
						<TableBodyCellEditable bind:value={item.cost} inputType="number">
							{new Intl.NumberFormat('en-GB', {
								style: 'currency',
								currency: 'GBP'
							}).format(item.cost)}
						</TableBodyCellEditable>
						<TableBodyCell>
							<Badge color={Number(item.quantity) !== Number(quantity) ? 'blue' : 'green'}
								>{new Intl.NumberFormat('en-GB', {
									style: 'currency',
									currency: 'GBP'
								}).format(item.cost * item.quantity)}</Badge
							>
						</TableBodyCell>
						<TableBodyCell>
							<span
								class="cursor-pointer"
								on:click={() => {
									quotedItems = quotedItems.filter((_, i) => i !== idx);
								}}
							>
								❌
							</span>
						</TableBodyCell>
					</TableBodyRow>
				{:else}
					<TableBodyRow>
						<TableBodyCell colspan="7">Enter quoted items</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
			<TableHead>
				<TableHeadCell>{customerOrderItems.length}</TableHeadCell>
				<TableHeadCell />
				<TableHeadCell />
				<TableHeadCell>{quotedItems.reduce((a, v) => a + Number(v.quantity), 0)}</TableHeadCell>
				<TableHeadCell>
					<Badge color="blue">
						{new Intl.NumberFormat('en-GB', {
							style: 'currency',
							currency: 'GBP'
						}).format(unitTotalQuoted)}
					</Badge>
				</TableHeadCell>
				<TableHeadCell>
					<Badge color={fullyPaid ? 'green' : 'red'}>
						{new Intl.NumberFormat('en-GB', {
							style: 'currency',
							currency: 'GBP'
						}).format(totalQuoted)}
					</Badge>
				</TableHeadCell>
				<TableHeadCell>
					<span
						on:click={() => {
							quotedItems = [
								...quotedItems,
								{
									description: '',
									type: 'LABOUR',
									quantity: 1,
									cost: 0
								}
							];
						}}
					>
						<Plus size="24" class="hover:text-green-600 cursor-pointer" />
					</span>
				</TableHeadCell>
			</TableHead>
		</Table>
	</div>

	<div class="mt-2">
		<Table hoverable>
			<TableHead>
				<TableHeadCell padding="px-1 pt-2" colspan="7">Paid</TableHeadCell>
			</TableHead>
			<TableHead>
				<TableHeadCell>#</TableHeadCell>
				<TableHeadCell>Description</TableHeadCell>
				<TableHeadCell>Type</TableHeadCell>
				<TableHeadCell>Quantity</TableHeadCell>
				<TableHeadCell>Unit Cost</TableHeadCell>
				<TableHeadCell>Total Cost</TableHeadCell>
				<TableHeadCell />
			</TableHead>
			<TableBody>
				{#each customerOrderItems as item, idx}
					<TableBodyRow
						class={`cursor-pointer`}
						on:click={() => {
							//goto('/kitting/' + job.id);
						}}
					>
						<TableBodyCell>
							{idx + 1}
						</TableBodyCell>


						<TableBodyCellEditable bind:value={item.description}>
							{item.description || '--------------'}
						</TableBodyCellEditable>
						<TableBodyCellEditable bind:value={item.type} inputType="dropdown" options={typeOptions}>
							{item.type}
						</TableBodyCellEditable>
						<TableBodyCellEditable bind:value={item.quantity} inputType="number">
							<Badge color={Number(item.quantity) !== Number(quantity) ? 'blue' : 'green'}>{item.quantity}</Badge>
						</TableBodyCellEditable>
						<TableBodyCellEditable bind:value={item.cost} inputType="number">
							{new Intl.NumberFormat('en-GB', {
								style: 'currency',
								currency: 'GBP'
							}).format(item.cost)}
						</TableBodyCellEditable>
						<TableBodyCell>
							<Badge color={Number(item.quantity) !== Number(quantity) ? 'blue' : 'green'}
								>{new Intl.NumberFormat('en-GB', {
									style: 'currency',
									currency: 'GBP'
								}).format(item.cost * item.quantity)}</Badge
							>
						</TableBodyCell>
						<TableBodyCell>
							<span
								class="cursor-pointer"
								on:click={() => {
									customerOrderItems = customerOrderItems.filter((_, i) => i !== idx);
								}}
							>
								❌
							</span>
						</TableBodyCell>
					</TableBodyRow>
				{:else}
					<TableBodyRow>
						<TableBodyCell colspan="7">Enter ordered items</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
			<TableHead>
				<TableHeadCell>{customerOrderItems.length}</TableHeadCell>
				<TableHeadCell />
				<TableHeadCell />
				<TableHeadCell>{customerOrderItems.reduce((a, v) => a + Number(v.quantity), 0)}</TableHeadCell>
				<TableHeadCell>
					<Badge color={unitTotalPaid === unitTotalQuoted ? 'green' : 'red'}>
						{new Intl.NumberFormat('en-GB', {
							style: 'currency',
							currency: 'GBP'
						}).format(unitTotalPaid)}
					</Badge>
				</TableHeadCell>
				<TableHeadCell>
					<Badge color={fullyPaid ? 'green' : 'red'}>
						{new Intl.NumberFormat('en-GB', {
							style: 'currency',
							currency: 'GBP'
						}).format(totalPaid)}
					</Badge>
				</TableHeadCell>
				<TableHeadCell>
					<span
						on:click={() => {
							customerOrderItems = [
								...customerOrderItems,
								{
									description: '',
									type: 'LABOUR',
									quantity: 1,
									cost: 0
								}
							];
						}}
					>
						<Plus size="24" class="hover:text-green-600 cursor-pointer" />
					</span>
				</TableHeadCell>
			</TableHead>
		</Table>
	</div> -->

	<div class="pt-4 mx-auto">
		<Toggle size="small" color="blue" bind:checked={createKit}>Create kit</Toggle>
	</div>
	<div class="pt-8">
		<Button color="blue" on:click={() => addJob()} disabled={jobAdding}>Add</Button>
	</div>
</div>
<div class="pt-4 max-h-500px mx-auto">
	{#if assembly?.id}
		<!-- <AssemblyInfoOverview assemblyId={assembly.id} /> -->
	{/if}
</div>

<Modal bind:open={createAssemblyVisible} outsideclose size="md">
	<AddAssembly />
</Modal>
<Modal bind:open={createCustomerVisible} outsideclose size="lg">
	<AddCustomer />
</Modal>
