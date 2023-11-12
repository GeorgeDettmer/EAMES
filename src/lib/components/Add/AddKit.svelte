<script lang="ts">
	import { queryStore, getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import { Label, Input, Helper, Select, Badge, Modal, Button, Toggle } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { messagesStore } from 'svelte-legos';
	const urqlClient = getContextClient();

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
	$: jobs = $jobsStore?.data?.jobs?.map((j) => {
		return { value: j, name: `${j.id} (${j.batch})` };
	});

	let id;
	let batch;
	let customer;
	let quantity = 1;
	let assembly;
	let createKit = false;

	$: assemblies = customer?.jobs?.map((j) => {
		const assembly = j?.assembly;
		return { value: assembly, name: `${assembly?.name} (${assembly?.revision_external})` };
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
</script>

<div class="w-1/2 mx-auto">
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
		<div class="flex">
			<div class="w-2/3" />
			<div class="">
				<Label>Quantity</Label>
				<Input placeholder={1} type="number" bind:value={quantity} />
			</div>
		</div>
		<div class="">
			<Label>Customer</Label>
			<Select items={customers} bind:value={customer} placeholder="Select customer" />
		</div>
		<div class="my-auto pt-4">
			{#if customer?.jobs_aggregate?.aggregate?.count}
				<Badge color="blue" large>{customer?.jobs_aggregate?.aggregate?.count}</Badge>
			{/if}
		</div>
		<div>
			<div class="">
				<Label>Assemblies</Label>
				{#if assemblies}
					<Select items={assemblies} bind:value={assembly} placeholder="Select assembly" />
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
