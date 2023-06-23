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
			} else {
				updateComponentOutline(step?.reference, 'TOP', tailwindColorToHex('green-400'));
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
			} else {
				updateComponentOutline(step?.reference, 'TOP', tailwindColorToHex('red-600'));
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
	$: stepsComplete = steps?.filter((i) => i?.signoffs?.length > 0);
	$: stepsCompleteCount = stepsComplete?.length;
	$: stepsCount = steps?.length;
	$: complete = stepsCompleteCount === stepsCount;
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
				updateComponentOutline(
					i?.reference,
					'TOP',
					i?.signoffs?.length > 0 ? tailwindColorToHex('green-400') : tailwindColorToHex('red-600')
				);
			}
		});
		console.log('DRAW DONE', e ?? '');
		getRenderers().forEach((r) => {
			r.scaleX(0.275);
			r.scaleY(0.275);
			r.setPosition({ x: 270, y: 600 });
		});
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

	let updateComponentOutline = (
		reference: string,
		rendererId: string = 'TOP',
		colour: string,
		width: number = 5,
		opacity: number = 1
	) => {
		const group = getComponentGroup(reference, rendererId);
		console.log('Update component outline:', reference, colour, group);
		if (!group) {
			console.log('Update component outline colour:', 'NO GROUP', reference);
			return;
		}

		group?.find(`.outline`)?.forEach((c) => {
			console.log('Update component outline:', c);
			if (colour) {
				c.stroke(colour);
			}
			if (width) {
				c.strokeWidth(width);
			}
			if (opacity) {
				c.opacity(opacity);
			}
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
				onBoardItemClick(component?.component);
			}
			if (eventType == 'mouseover') {
				//console.debug('COMPONENT OVER: ', component?.component, component, detail);
				//currentInfo = `${component?.component} (${component?.device})`;
			}
			if (eventType == 'mouseout') {
				//console.debug('COMPONENT OUT: ', component?.component, component, detail);
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

	function onBoardItemClick(reference: string) {
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
		const step = steps.filter((s) => s.reference === reference)?.[0];
		let e = { detail: { step: step } };
		handleStepClick(e);
		console.log(reference, step, e);
		/* if (!steps[idx].signoff) {
			items[idx].signoff = user;
			updateComponentColour(items[idx].reference, 'green');
		} else {
			items[idx].signoff = null;
			updateComponentColour(items[idx].reference, '');
		} */
		//console.log(items[idx].signoff);
	}

	//INFO: Update CAD highlighting on steps change
	$: {
		if (steps) {
			draw_event();
		}
	}

	onMount(() => {});
</script>

{#if boardId}
	{#if !$boardInfoStore.data}
		<p>Loading...</p>
	{:else if $boardInfoStore.error}
		<p>Error: {$boardInfoStore.error.message}</p>
	{:else}
		<Blockquote border bg class="p-2 mb-1" borderClass="border-l-4 border-blue-900">
			{#if boardInfo?.job}
				<P weight="medium" size="2xl">EAS{boardInfo?.job?.batch}</P>
			{/if}
			<P weight="bold" size="xl">
				<span class="font-normal">{boardInfo?.job?.customer?.name}</span>
				{assembly?.name} ({assembly?.revision_external}:{assembly?.revision_internal}) [{assemblyId}]
			</P>
		</Blockquote>

		{#if boardInfo}
			<div class="flex max-h-[740px]">
				<div class="w-2/3">
					<div>
						{#if instruction}
							<Blockquote
								border
								bg
								class="p-1 flex-auto  mb-1"
								borderClass={`border-l-4 ${
									!steps
										? 'border-gray-600'
										: complete === false
										? 'border-red-600'
										: 'border-green-400'
								}`}
							>
								<P weight="bold" size="xl">{instruction?.name}: {instruction?.description}</P>
								<P weight="medium" size="sm">{instruction?.id} ({instruction?.revision})</P>
							</Blockquote>
						{/if}
					</div>
					<div class="outline-dotted outline-slate-500">
						<Viewer
							on:pin_event={pin_event}
							on:draw_done={draw_event}
							on:component_event={component_event}
							outlinePins={[1]}
							id="TOP"
							height={675}
							data={cad}
							layerToShow="TOP"
						/>
					</div>
				</div>
				<div class="float-right px-1 w-1/3 overflow-y-scroll">
					<select
						class="w-full mb-1 h-14"
						name="instruction"
						id="instructions"
						bind:value={instructionId}
					>
						{#each instructions as i}
							<option value={i.instruction.id}>{i.instruction.name}</option>
						{/each}
					</select>
					{#if instruction}
						<InstructionList
							on:header_click={handleHeaderClick}
							on:item_click={handleStepClick}
							on:item_mouse
							{instruction}
							{steps}
						/>{/if}
				</div>
			</div>
		{/if}
	{/if}
{:else}
	<p>No boardId</p>
{/if}
