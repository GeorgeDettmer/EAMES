<script lang="ts">
	export let data;
	import { createEventDispatcher } from 'svelte';
	import { gql, getContextClient, queryStore, subscriptionStore } from '@urql/svelte';

	import { Blockquote, P } from 'flowbite-svelte';

	import InstructionList from '$lib/components/InstructionList.svelte';

	let instructionId = 'c4d432d4-294b-4e8e-8aa2-a6a09f46f8fb';
	let boardId = data?.boardId;

	$: boardInfoStore = queryStore({
		client: getContextClient(),
		query: gql`
			query boardInfo($boardId: bigint!) {
				id
				assembly {
					id
					name
					assembly_instructions {
						instruction {
							id
							name
							description
							revision
						}
					}
				}
				job {
					id
					batch
					quantity
					customer {
						id
						name
					}
				}
				signoffsByBoardId {
					id
					step_id
					user {
						id
						username
						initials
						first_name
						last_name
					}
					created_at
					updated_at
					step {
						instruction {
							name
						}
					}
				}
			}
		`,
		variables: { boardId: boardId }
	});

	$: assemblyStepsStore = queryStore({
		client: getContextClient(),
		query: gql`
			query instructionSteps($assemblyId: bigint!) {
				steps(where: { assembly_id: { _eq: $assemblyId } }) {
					id
					reference
					part_id
					notes
				}
			}
		`,
		variables: { assemblyId: assemblyId }
	});

	$: instruction = $instuctionsStepsStore?.data?.instructions?.[0];
	$: assembly = $assemblyInfoStore?.data?.assemblies_by_pk;

	$: instructions = $assemblyInfoStore?.data?.steps || [];
</script>

<Blockquote border bg class="p-4 my-4">
	<P size="xl" height="relaxed">{assembly?.name}</P>
</Blockquote>

<div class="flex-col p-3">
	<select class="w-auto" name="instruction" id="instructions" bind:value={instructionId}>
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
