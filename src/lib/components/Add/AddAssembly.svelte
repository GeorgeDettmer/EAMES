<script lang="ts">
	import { queryStore, getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import { Label, Input, Helper, Select, Badge, Modal, Button, Toggle } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { messagesStore } from 'svelte-legos';
	const urqlClient = getContextClient();

	$: assembliesStore = queryStore({
		client: getContextClient(),
		query: gql`
			query assemblies {
				assemblies(order_by: { name: asc }) {
					id
					name
					revision_external
					revision_internal
				}
			}
		`,
		requestPolicy: 'cache-and-network'
	});
	$: assemblies = $assembliesStore?.data?.assemblies;
	$: assemblyExists =
		(
			assemblies?.filter((a) => a.name.toLowerCase() === name.toLowerCase() && a.revision_external === revision_external) ||
			[]
		).length > 0;

	let name = '';
	let revision_external = '';
	let revision_internal;
	let bom_id;
	let cad_id;

	let assemblyAdding = false;
	async function addAssembly() {
		if (assemblyAdding) return;
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'error');
			return;
		}
		if (!name || !revision_external) {
			messagesStore('Assembly name & external revision must be set', 'error');
			return;
		}
		if (assemblyExists) {
			messagesStore('Assembly with this name already exists!', 'error');
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
		assemblyAdding = true;
		let mutationResult;

		mutationResult = await urqlClient.mutation(
			gql`
				mutation addAssembly(
					$name: String!
					$revision_external: String!
					$revision_internal: Int = 1
					$bom_id: uuid
					$cad_id: uuid
					$meta: json = []
				) {
					insert_assemblies_one(
						object: {
							name: $name
							revision_external: $revision_external
							revision_internal: $revision_internal
							meta: $meta
							bom_id: $bom_id
							cad_id: $cad_id
						}
					) {
						id
					}
				}
			`,
			{ name, revision_external, revision_internal, bom_id, cad_id, meta: undefined }
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore('Inserted job: ' + mutationResult.data.insert_assemblies_one.id, 'success');
			name = '';
			revision_external = '';
		}
		assemblyAdding = false;
	}
</script>

<div class="mx-auto">
	<div class="grid md:grid-cols-2 gap-2 gap-y-1">
		<div class="flex">
			<div class="w-2/3">
				<Label>Name</Label>
				<Input placeholder={'Assembly name'} type="text" bind:value={name} />
				{#if assemblyExists}
					<Helper color="red">Assembly with this name already exists!</Helper>
				{/if}
			</div>
			<div class="w-1/3">
				<Label>Revision</Label>
				<Input placeholder={null} type="text" bind:value={revision_external} />
			</div>
		</div>
		<!-- <div class="flex">
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
		</div> -->
	</div>

	<!-- <div class="pt-4 mx-auto">
		<Toggle size="small" color="blue" bind:checked={createKit}>Create kit</Toggle>
	</div> -->
	<div class="pt-8">
		<Button color="blue" on:click={() => addAssembly()} disabled={assemblyAdding}>Add</Button>
	</div>
</div>
<div class="pt-4 max-h-500px mx-auto" />
