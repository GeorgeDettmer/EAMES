<script lang="ts">
	export let data;
	import { page } from '$app/stores';
	import { createEventDispatcher } from 'svelte';
	import { localStorageDefault } from '$lib/utils';
	import {
		gql,
		getContextClient,
		queryStore,
		subscriptionStore,
		mutationStore
	} from '@urql/svelte';

	import { Blockquote, P, Hr } from 'flowbite-svelte';

	import InstructionList from '$lib/components/InstructionList.svelte';

	let instructionId = data?.instructionId;
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
						steps(distinct_on: instruction_id) {
							instruction {
								id
								name
								description
								revision
								active
								created_at
								type
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
	$: assemblyId = assembly?.id;
	$: instructions = assembly?.steps || [];

	$: instruction = instructions?.filter((i) => i?.instruction?.id === instructionId)?.[0]
		?.instruction;

	$: stepsInfoStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription Steps($assemblyId: bigint!, $boardId: bigint!, $instructionId: uuid!) {
				steps(
					where: { assembly_id: { _eq: $assemblyId }, instruction_id: { _eq: $instructionId } }
					order_by: { reference: asc_nulls_first, part_id: desc }
				) {
					id
					reference
					part_id
					notes
					created_at
					color
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
					assembly_id
				}
			}
		`,
		variables: { assemblyId, boardId, instructionId }
	});

	$: steps = $stepsInfoStore?.data?.steps;
	$: console.log(instructions);
	$: {
		if (!instructionId && instructions?.length > 0) {
			const defaultInstructionType = localStorage.getItem(
				'EAMES_workstationDefaultInstructionType'
			);
			const defaultInstructionTypeId = instructions.filter(
				(i) => i?.instruction.type == defaultInstructionType
			);
			console.log(defaultInstructionType, instructions, defaultInstructionTypeId);
			instructionId = defaultInstructionTypeId?.[0]?.instruction?.id || instructions?.[0]?.id;
		}
	}
</script>

{#if boardId}
	{#if !$boardInfoStore.data}
		<p>Loading...</p>
	{:else if $boardInfoStore.error}
		<p>Error: {$boardInfoStore.error.message}</p>
	{:else}
		<Blockquote border bg class="p-4 my-4" borderClass="border-l-4 border-blue-900">
			{#if boardInfo?.job}
				<P weight="medium">{boardInfo?.job?.customer?.name}</P>
			{/if}
			<P weight="bold" size="xl">
				{assembly?.name} ({assembly?.revision_external}:{assembly?.revision_internal})
			</P>
			<P weight="medium" size="sm">{assemblyId}</P>
		</Blockquote>

		<div class="flex p-3">
			<select class="w-auto" name="instruction" id="instructions" bind:value={instructionId}>
				{#each instructions as i}
					<option value={i.instruction.id}>{i.instruction.name}</option>
				{/each}
			</select>
			{#if instruction}
				<Blockquote border bg class="p-1 ml-1">
					<P weight="bold" size="xl">{instruction?.name}: {instruction?.description}</P>
					<P weight="medium" size="sm">{instruction?.id} ({instruction?.revision})</P>
				</Blockquote>
			{/if}
		</div>
		{#if instruction}
			<div class="flex">
				<div class="outline-dotted w-2/3" />
				<div class="float-right px-1 w-1/3">
					<InstructionList
						on:header_click={handleHeaderClick}
						on:item_click={handleStepClick}
						{instruction}
						{steps}
					/>
				</div>
			</div>
		{/if}

		<pre>{JSON.stringify(steps, null, 2)}</pre>
	{/if}
{:else}
	<p>No boardId</p>
{/if}
