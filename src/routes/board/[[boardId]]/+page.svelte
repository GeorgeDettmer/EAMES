<script lang="ts">
	export let data;
	import { page } from '$app/stores';
	import { createEventDispatcher } from 'svelte';
	import {
		gql,
		getContextClient,
		queryStore,
		subscriptionStore,
		mutationStore
	} from '@urql/svelte';

	import { Blockquote, P, Hr } from 'flowbite-svelte';

	import InstructionList from '$lib/components/InstructionList.svelte';

	let instructionId = 'c4d432d4-294b-4e8e-8aa2-a6a09f46f8fb';
	let boardId = data?.boardId;

	function handleHeaderClick(e) {
		console.log('LIST HEADER CLICK', e);
	}

	async function handleStepClick(e) {
		const step = e.detail?.step;
		const signoffs = step?.signoffs;
		const signed = signoffs.length > 0;
		console.log('STEP CLICK', signed ? '✅' : '❌', step);
		if (signoffs.filter((s) => s.user.id === $page?.data?.user?.id).length > 0) {
			console.warn('USER ALREADY SIGNED OFF FOR STEP', step);
		}
		if (!signed) {
			let mutationResult = await gqlClient.mutation(
				gql`
					mutation insertSignoffs($boardId: bigint!, $step_id: uuid!, $user_id: uuid!) {
						insert_signoffs(
							objects: [{ board_id: $boardId, step_id: $step_id, user_id: $user_id }]
						) {
							affected_rows
							returning {
								id
							}
						}
					}
				`,
				{ boardId, step_id: step.id, user_id: $page?.data?.user?.id }
			);
			if (mutationResult?.error) {
				console.error('MUTATION ERROR: ', mutationResult);
			}
			console.log(mutationResult);
		} else {
			let mutationResult = await gqlClient.mutation(
				gql`
					mutation insertSignoffs($signoffId: uuid!) {
						delete_signoffs_by_pk(id: $signoffId) {
							id
						}
					}
				`,
				{ signoffId: signoffs?.[0]?.id }
			);
			if (mutationResult?.error) {
				console.error('MUTATION ERROR: ', mutationResult);
			}
			console.log(mutationResult);
		}
	}

	let gqlClient = getContextClient();
	let updateSignoffsResult;
	const updateSignoffs = ({ boardId, step_id, user_id }) => {
		updateSignoffsResult = mutationStore({
			gqlClient,
			query: gql`
				mutation updateSignoffs {
					insert_signoffs(objects: { board_id: $boardId, step_id: $step_id, user_id: $user_id }) {
						affected_rows
						returning {
							id
						}
					}
				}
			`,
			variables: { boardId, step_id, user_id: user_id || $page?.data?.user?.id }
		});
	};

	$: boardInfoStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription Boards($boardId: bigint!) {
				boards(where: { id: { _eq: $boardId } }) {
					id
					job {
						id
						quantity
						batch
						customer {
							id
							name
						}
						created_at
					}
					assembly {
						assembly_instructions {
							instruction {
								id
								name
								description
								stepsByInstructionId {
									id
									reference
									part_id
									notes
									created_at
									signoffs(where: { board_id: { _eq: $boardId } }) {
										id
										created_at
										updated_at
										user {
											id
											username
											first_name
											last_name
											initials
											color
										}
									}
								}
								revision
								active
								created_at
							}
						}
						id
						name
						revision_external
						revision_internal
					}
					updated_at
				}
			}
		`,
		variables: { boardId: boardId }
	});

	$: boardInfo = $boardInfoStore?.data?.boards?.[0];
	$: assembly = boardInfo?.assembly || {};
	$: instructions = assembly?.assembly_instructions || [];

	$: instruction = instructions?.filter((i) => i?.instruction?.id === instructionId)?.[0]
		?.instruction;
	$: steps = instruction?.stepsByInstructionId;

	$: console.log('DATA:', instruction);
</script>

{#if boardId}
	{#if !$boardInfoStore.data}
		<p>Loading...</p>
	{:else if $boardInfoStore.error}
		<p>Error: {$boardInfoStore.error.message}</p>
	{:else}
		<Blockquote border bg class="p-4 my-4">
			<P weight="medium">{boardInfo?.job?.customer?.name}</P>
			<P weight="bold" size="xl">{assembly?.name} ({assembly?.revision_external})</P>
		</Blockquote>

		<div class="flex p-3">
			<select class="w-auto" name="instruction" id="instructions" bind:value={instructionId}>
				{#each instructions as i}
					<option value={i.instruction.id}>{i.instruction.name}</option>
				{/each}
			</select>
			{#if instruction?.name}
				<Blockquote border bg class="p-1 ml-1">
					<P weight="bold" size="xl">{instruction?.name}: {instruction?.description}</P>
					<P weight="medium" size="sm">{instruction?.id} ({instruction?.revision})</P>
				</Blockquote>
			{/if}
		</div>
		<InstructionList
			on:header_click={handleHeaderClick}
			on:item_click={handleStepClick}
			{instruction}
			{steps}
		/>
		<pre>{JSON.stringify(steps, null, 2)}</pre>
	{/if}
{:else}
	<p>No boardId</p>
{/if}