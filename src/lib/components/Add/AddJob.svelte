<script lang="ts">
	import { queryStore, getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import { Label, Input, Helper, Select, Badge, Modal } from 'flowbite-svelte';
	import AssemblyInfoOverview from '../Assembly/AssemblyInfoOverview.svelte';

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

	let id;
	let batch;
	let customer;
	let quantity;
	let assembly;

	$: assemblies = customer?.jobs?.map((j) => {
		const assembly = j?.assembly;
		return { value: assembly, name: `${assembly?.name} (${assembly?.revision_external})` };
	});

	$: console.log(customer?.jobs);

	function validate(type: string) {
		if (type === 'id') {
			console.log(type, id);
			return !(id?.length > 0);
		}
	}
</script>

<div class="w-1/2 mx-auto">
	<div class="grid md:grid-cols-2 gap-2 gap-y-1">
		<div class="flex">
			<div class="w-2/3">
				<Label>Job</Label>
				<Input size="lg" placeholder={nextId} type="number" bind:value={id} />
			</div>
			<div class="w-1/3">
				<Label>Batch</Label>
				<Input size="lg" placeholder={null} type="number" bind:value={batch} />
			</div>
		</div>
		<div class="flex">
			<div class="w-2/3" />
			<div class="">
				<Label>Quantity</Label>
				<Input size="lg" placeholder={1} type="number" bind:value={quantity} />
			</div>
		</div>
		<div class="">
			<Label>Customer</Label>
			<Select items={customers} bind:value={customer} placeholder="Select customer" />
		</div>
		<div class="my-auto">
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
					<Input size="lg" type="text" />
				{/if}
			</div>
		</div>
		<div class="my-auto">
			{#if assembly}
				{#if assembly?.bom?.lines_aggregate?.aggregate?.count}
					<Badge color="blue" large>{assembly?.bom?.lines_aggregate?.aggregate?.count}</Badge>
				{/if}
			{/if}
		</div>
	</div>

	<div />
</div>
<div class="pt-4 max-h-500px mx-auto">
	{#if assembly?.id}
		<!-- <AssemblyInfoOverview assemblyId={assembly.id} /> -->
	{/if}
</div>
