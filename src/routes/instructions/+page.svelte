<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { gql, getContextClient, queryStore, subscriptionStore } from '@urql/svelte';

	import { Blockquote, P } from 'flowbite-svelte';

	import InstructionList from '$lib/components/InstructionList.svelte';

	let instructionId = 'c4d432d4-294b-4e8e-8aa2-a6a09f46f8fb';
	let assemblyId = 2;

	$: assemblyInfoStore = queryStore({
		client: getContextClient(),
		query: gql`
			query assemblyInfo($assemblyId: bigint!) {
				assemblies_by_pk(id: $assemblyId) {
					id
					name
					revision_external
					revision_internal
				}
				steps(where: { assembly_id: { _eq: $assemblyId } }, distinct_on: instruction_id) {
					instruction {
						id
						name
					}
				}
			}
		`,
		variables: { assemblyId: assemblyId }
	});

	$: instuctionsStepsStore = queryStore({
		client: getContextClient(),
		query: gql`
			query instructionSteps($instructionId: uuid!, $assemblyId: bigint!) {
				instructions(where: { id: { _eq: $instructionId } }) {
					id
					name
					revision
					description
					active
					created_at
					updated_at
					stepsByInstructionId(where: { assembly_id: { _eq: $assemblyId } }) {
						id
						reference
						part_id
						notes
						signoffs {
							id
							user {
								id
								username
								first_name
								last_name
								initials
								color
							}
							created_at
							updated_at
						}
					}
				}
			}
		`,
		variables: { instructionId: instructionId, assemblyId: assemblyId }
	});

	$: instruction = $instuctionsStepsStore?.data?.instructions?.[0];
	$: assembly = $assemblyInfoStore?.data?.assemblies_by_pk;

	$: instructions = $assemblyInfoStore?.data?.steps || [];
</script>

<Blockquote border bg class="p-4 my-4">
	<P size="xl" height="relaxed">{assembly?.name}</P>
</Blockquote>

<div class="flex-col p-3">
	<select class="w-" name="instruction" id="instructions" bind:value={instructionId}>
		{#each instructions as i}
			<option value={i.instruction.id}>{i.instruction.name}</option>
		{/each}
	</select>
	{#if $instuctionsStepsStore.fetching}
		<p>Loading...</p>
	{:else if $instuctionsStepsStore.error}
		<p>Error: {$instuctionsStepsStore.error.message}</p>
	{:else}
		<InstructionList {instruction} steps={instruction?.stepsByInstructionId} />
	{/if}
</div>
