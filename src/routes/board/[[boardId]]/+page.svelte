<script lang="ts">
	export let data;
	import { page } from '$app/stores';
	import { createEventDispatcher, onMount } from 'svelte';
	import { localStorageDefault, tailwindColors } from '$lib/utils';
	import {
		gql,
		getContextClient,
		queryStore,
		subscriptionStore,
		mutationStore
	} from '@urql/svelte';

	import { Blockquote, P, Accordion, AccordionItem } from 'flowbite-svelte';

	import InstructionList from '$lib/components/InstructionList.svelte';
	import Viewer, { getRenderers, getComponentGroup } from '$lib/components/Viewer.svelte';

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
						assemblies_cad {
							id
							name
							data
						}
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
					position
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
	$: {
		if (!instructionId && instructions?.length > 0) {
			const defaultInstructionType = localStorage
				.getItem('EAMES_workstationDefaultInstructionType')
				?.toUpperCase();
			const defaultInstructionTypeId = instructions.filter(
				(i) => i?.instruction?.type?.toUpperCase() === defaultInstructionType
			);
			const inst = defaultInstructionTypeId?.[0]?.instruction || instructions?.[0]?.instruction;
			instructionId = inst?.id;
			console.info(
				'NO INSTRUCTION ID',
				`EAMES_workstationDefaultInstructionType: ${defaultInstructionType}`,
				'USING:',
				instructionId,
				inst
			);
		}
	}

	$: cad = boardInfo?.assembly?.assemblies_cad || {};
	$: console.info('BOARD DATA', cad);

	$: user = $page?.data?.user;

	let tailwindColorToHex = (color: string) => {
		let c = color.split('-');
		return tailwindColors?.[c?.[0]]?.[c?.[1]] || '#fff4';
	};

	let draw_event = (e) => {
		steps?.forEach((i) => {
			if (i?.reference && i?.color) {
				console.log(i.color, tailwindColorToHex(i.color));
				updateComponentColour(i?.reference, tailwindColorToHex(i?.color || 'orange-500'), 'TOP');
			}
		});
		console.log('DRAW DONE', e);
	};
	let pin_event = (e) => {
		let event = e?.detail?.event;
		let eventType = event?.type;
		let detail = e?.detail;
		let component = e?.detail?.component;
		let pin = detail?.pin;

		if (eventType == 'mousedown') {
			console.log('PIN CLICK: ', pin?.pin, component?.component, component, detail);
		}
	};

	let updateComponentOutline = (reference: string, colour: string, rendererId: string = 'TOP') => {
		let group = getComponentGroup(reference, rendererId);
		console.log('Update component outline colour:', reference, colour, group);
		if (!group) {
			console.log('Update component outline colour:', 'NO GROUP', reference);
			return;
		}
		if (colour == '') {
			group.find(`.outline`).forEach((c) => {
				console.log('Update component colour:', c);
				c.fill('blue');
				c.strokeWidth(2);
			});
			return;
		}
		group.find(`.outline`).forEach((c) => {
			console.log('Update component colour:', c);
			c.stroke(colour);
			c.strokeWidth(5);
			c.opacity(1);
		});
	};

	let component_event = (e) => {
		let event = e?.detail?.event;
		let eventType = event?.type;
		let detail = e?.detail;
		let component = detail?.component;
		if (detail?.pin_idx == undefined) {
			if (eventType == 'mousedown') {
				console.log('COMPONENT CLICK: ', component?.component, component, detail);
				let itemIdx = steps.findIndex((i) => i.reference == component?.component);
				onBoardItemClick(itemIdx);
			}
			if (eventType == 'mouseover') {
				console.debug('COMPONENT OVER: ', component?.component, component, detail);
				//currentInfo = `${component?.component} (${component?.device})`;
			}
			if (eventType == 'mouseout') {
				console.debug('COMPONENT OUT: ', component?.component, component, detail);
				//currentInfo = '';
			}
		}
		//console.log(`COMPONENT EVENT | ${eventType.toUpperCase()}:`, component);
	};

	let updateComponentColour = (
		reference: string,
		colour: string,
		rendererId: string = 'TOP',
		opacity: number = 1
	) => {
		let group = getComponentGroup(reference, rendererId);
		console.log('Update component colour:', reference, colour, group);
		if (!group) {
			console.log('Update component colour:', 'NO GROUP', reference);
			return;
		}
		if (colour == '') {
			group.find(`.outline`).forEach((c) => {
				console.log('Update component colour:', c);
				//c.fillEnabled(false);
				c.fill('');
			});
			group.find(`.lead`).forEach((c) => {
				console.log('Update component lead colour:', c);
				c.fillEnabled(false);
			});
			return;
		}
		group.find(`.outline`).forEach((c) => {
			console.log('Update component colour:', c);
			c.fillEnabled(true);
			c.fill(colour);
			c.opacity(0.75);
		});
		group.find(`.lead`).forEach((c) => {
			console.log('Update component lead colour:', c);
			c.fillEnabled(false);
			c.fill(colour);
		});
	};

	function onBoardItemClick(idx: number) {
		/* if (!Object.keys(user?.profile?.roles?.processes).includes(currentProcess.toLowerCase())) {
			alert(
				`You do not have permission to complete process: ${currentProcess} (${Object.keys(
					user?.profile?.roles?.processes
				)})`
			);
			return;
		} */
		console.log('onItemClick');
		//console.log(items[idx].signoff);
		const step = steps[idx];
		let e = { detail: { event: step } };
		handleStepClick(e);
		console.log(idx, step);
		/* if (!steps[idx].signoff) {
			items[idx].signoff = user;
			updateComponentColour(items[idx].reference, 'green');
		} else {
			items[idx].signoff = null;
			updateComponentColour(items[idx].reference, '');
		} */
		//console.log(items[idx].signoff);
	}

	onMount(() => {
		getRenderers().forEach((r) => {
			r.scaleX(0.3186);
			r.scaleY(0.3186);
			//r.setPosition({ x: 500, y: 130 });
			r.setPosition({ x: 270, y: 667 });
		});
	});
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
			<div class="flex h-max-screen">
				<div class="outline-dotted w-2/3">
					{#if steps}
						<Viewer
							on:pin_event={pin_event}
							on:draw_done={draw_event}
							on:component_event={component_event}
							outlinePins={[1]}
							id="TOP"
							height={500}
							data={cad}
							layerToShow="TOP"
						/>
					{/if}
				</div>
				<div class="float-right px-1 w-1/3 overflow-y-scroll">
					<InstructionList
						on:header_click={handleHeaderClick}
						on:item_click={handleStepClick}
						{instruction}
						{steps}
					/>
				</div>
			</div>
		{/if}
		<Accordion>
			<AccordionItem>
				<span slot="header">Step data</span>
				<pre>{JSON.stringify(steps, null, 2)}</pre>
			</AccordionItem>
		</Accordion>
	{/if}
{:else}
	<p>No boardId</p>
{/if}
