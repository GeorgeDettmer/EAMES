<script lang="ts">
	import { queryStore, getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import {
		Label,
		Input,
		Helper,
		Select,
		Badge,
		Modal,
		Button,
		Toggle,
		Checkbox,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import AssemblyInfoOverview from '../Assembly/AssemblyInfoOverview.svelte';
	import { page } from '$app/stores';
	import { messagesStore } from 'svelte-legos';
	import SearchList from '../Misc/SearchList.svelte';
	import AddAssembly from './AddAssembly.svelte';
	import { Plus, PlusCircle } from 'svelte-heros-v2';
	import { goto } from '$app/navigation';
	import TableBodyCellEditable from '../Misc/Table/TableBodyCellEditable.svelte';
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
	let deliveryDate;
	let leadTime = 1;
	let createKit = false;
	let createAssembly = false;

	$: assemblies = $assembliesStore?.data?.assemblies?.map((assembly) => {
		return {
			value: assembly,
			name: `${assembly?.name} (${assembly?.revision_external || '-'}|${assembly?.bom?.revision_external || '-'}|${
				assembly?.assemblies_cad?.revision_external || '-'
			})`
		};
	});

	function validate(type: string) {
		if (type === 'id') {
			console.log(type, id);
			return !(id?.length > 0);
		}
	}

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
		/* if (!$page?.data?.user?.processes['eng']) {
			alert(
				`You do not have permission to insert components. You have permission for: ${Object.keys(
					$page?.data?.user?.processes
				)}`
			);
			return;
		} */
		jobAdding = true;
		let mutationResult;

		mutationResult = await urqlClient.mutation(
			gql`
				mutation insertJob($id: bigint!, $customer_id: bigint!, $batch: Int = 0, $quantity: Int, $assembly_id: bigint) {
					insert_jobs_one(
						object: { id: $id, customer_id: $customer_id, batch: $batch, quantity: $quantity, assembly_id: $assembly_id }
					) {
						id
					}
				}
			`,
			{ id: id || nextId, batch, quantity, customer_id: customer.id, assembly_id: assembly.id }
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore('Inserted job: ' + mutationResult.data.insert_jobs_one.id, 'success');
		}
		if (createKit) {
			let job_id = mutationResult.data.insert_jobs_one.id;
			mutationResult = await urqlClient.mutation(
				gql`
					mutation createKit {
						insert_erp_kits_one(object: {}) {
							id
						}
					}
				`,
				{}
			);
			if (mutationResult?.error) {
				console.error('MUTATION ERROR: ', mutationResult);
				messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
			} else {
				let kit_id = mutationResult.data.insert_erp_kits_one.id;
				console.log('MUTATION RESULT: ', mutationResult);
				messagesStore('Created kit: ' + mutationResult.data.insert_erp_kits_one.id, 'success');
				mutationResult = await urqlClient.mutation(
					gql`
						mutation createJobKit($job_id: bigint!, $kit_id: uuid!) {
							insert_material_jobs_kits_one(object: { job_id: $job_id, kit_id: $kit_id }) {
								id
							}
						}
					`,
					{ job_id, kit_id }
				);
				if (mutationResult?.error) {
					console.error('MUTATION ERROR: ', mutationResult);
					messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
				} else {
					console.log('MUTATION RESULT: ', mutationResult);
					messagesStore('Created kit: ' + mutationResult.data.insert_erp_kits_one.id, 'success');
				}
			}
		}
		jobAdding = false;
	}

	//TODO: Expand....
	let customerOrderItems = [];
	let quotedItems = [];
	let typeOptions = [{ id: 'LABOUR' }, { id: 'MATERIAL' }, { id: 'OTHER' }];
	$: totalQuoted = quotedItems.reduce((a, v) => a + Number(v.cost), 0);
	$: totalPaid = customerOrderItems.reduce((a, v) => a + Number(v.cost), 0);
	$: fullyPaid = totalPaid === totalQuoted;
</script>

<div class="w-2/3 mx-auto">
	<div class="grid md:grid-cols-2 gap-2 gap-y-1">
		<div class="flex">
			<div class="w-2/3">
				<Label>Job</Label>
				<Input placeholder={nextId} type="number" bind:value={id} />
			</div>
			<div class="w-1/3">
				<Label>Batch</Label>
				<Input placeholder={null} type="number" bind:value={batch} />
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
			<div
				class="w-1/2"
				on:mousewheel={(e) => {
					leadTime = Math.max(Number(leadTime) + (e.deltaY > 0 ? -1 : +1), 1);
				}}
				on:change={(e) => {}}
			>
				<Label>Lead time</Label>
				<Input placeholder={1} type="number" bind:value={leadTime} />
			</div>
		</div>
		<div class="">
			<Label>Customer</Label>
			<Select items={customers} bind:value={customer} placeholder="Select customer" />
		</div>
		<div class="flex gap-x-2">
			<div class="w-1/2">
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
				<Input type="date" min={shipDate} on:change={() => {}} bind:value={deliveryDate} />
			</div>
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
							<a class="hover:text-green-500 cursor-pointer" target="_blank" href={window.origin + '/add/assembly'}>
								<PlusCircle />
							</a>
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

	<div class="mt-8">
		<Table hoverable>
			<TableHead>
				<TableHeadCell padding="px-1 pt-2" colspan="6">Quoted</TableHeadCell>
			</TableHead>
			<TableHead>
				<TableHeadCell>#</TableHeadCell>
				<TableHeadCell>Description</TableHeadCell>
				<TableHeadCell>Type</TableHeadCell>
				<TableHeadCell>Quantity</TableHeadCell>
				<TableHeadCell>Cost</TableHeadCell>
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
						<!-- <TableBodyCell>
							{item.description}
						</TableBodyCell> -->

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
						<TableBodyCell colspan="6">Enter quoted items</TableBodyCell>
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
				<TableHeadCell padding="px-1 pt-2" colspan="6">Paid</TableHeadCell>
			</TableHead>
			<TableHead>
				<TableHeadCell>#</TableHeadCell>
				<TableHeadCell>Description</TableHeadCell>
				<TableHeadCell>Type</TableHeadCell>
				<TableHeadCell>Quantity</TableHeadCell>
				<TableHeadCell>Cost</TableHeadCell>
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
						<!-- <TableBodyCell>
							{item.description}
						</TableBodyCell> -->

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
						<TableBodyCell colspan="6">Enter ordered items</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
			<TableHead>
				<TableHeadCell>{customerOrderItems.length}</TableHeadCell>
				<TableHeadCell />
				<TableHeadCell />
				<TableHeadCell>{customerOrderItems.reduce((a, v) => a + Number(v.quantity), 0)}</TableHeadCell>
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
	</div>

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
