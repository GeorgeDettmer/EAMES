<script lang="ts">
	export let data;
	import { page } from '$app/stores';
	import { tailwindColors } from '$lib/utils';
	import { gql, getContextClient, subscriptionStore } from '@urql/svelte';

	import { Blockquote, P, Label, Select } from 'flowbite-svelte';

	import InstructionList from '$lib/components/InstructionList.svelte';
	import Viewer, { getRenderers, getComponentGroup } from '$lib/components/Viewer.svelte';
	import { getContext } from 'svelte';

	let instructionId = data?.instructionId;
	let boardId = data?.boardId;

	const urqlClient = getContextClient();

	function handleHeaderClick(e) {
		console.log('LIST HEADER CLICK', e);
	}
	async function handleStepClick(e) {
		const step = e.detail?.step;
		const signoffs = step?.signoffs;
		const signed = signoffs.length > 0;
		console.log('STEP CLICK', signed ? '✅' : '❌', step);
		if (signoffs?.filter((s) => s.user.id === user?.id).length > 0) {
			console.warn('USER ALREADY SIGNED OFF FOR STEP', step);
		}
		if (!signed) {
			let mutationResult = await urqlClient.mutation(
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
				{ boardId, step_id: step.id, user_id: user?.id }
			);
			if (mutationResult?.error) {
				console.error('MUTATION ERROR: ', mutationResult);
			} else {
				updateComponentOutline(step?.reference, 'TOP', tailwindColorToHex('green-400'), 10);
			}
			console.log(mutationResult);
		} else {
			let mutationResult = await urqlClient.mutation(
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
				updateComponentOutline(step?.reference, 'TOP', tailwindColorToHex('red-600'), 5);
			}
			console.log(mutationResult);
		}
	}

	$: boardInfoStore = subscriptionStore({
		client: urqlClient,
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
		client: urqlClient,
		query: gql`
			subscription Steps($assemblyId: bigint!, $boardId: bigint!) {
				steps(
					where: { assembly_id: { _eq: $assemblyId } }
					order_by: { reference: asc_nulls_first, part_id: desc }
				) {
					id
					reference
					part_id
					notes
					created_at
					color
					position
					instruction_id
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
		variables: { assemblyId, boardId }
	});

	$: allSteps = $stepsInfoStore?.data?.steps;
	$: steps = allSteps?.filter((s) => s?.instruction_id === instructionId);
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
	$: console.info('BOARD', boardInfo);
	$: console.info('STEPS', steps);
	$: console.info('INSTRUCTION', instruction);
	const currentBoardStore = getContext('currentBoard');
	$: currentBoardStore.set({ boardInfo: boardInfo, boardSteps: allSteps });
	$: user = $page?.data?.user;
	$: processes = user?.processes || {};
	$: allowedProcesses = Object.entries(processes)?.filter((p) => p[1]);
	$: console.log('PROCESSES', processes, allowedProcesses);

	let tailwindColorToHex = (color: string) => {
		let c = color.split('-');
		return tailwindColors?.[c?.[0]]?.[c?.[1]] || '#fff4';
	};

	let draw_event = (e) => {
		steps?.forEach((i) => {
			if (i?.reference && i?.color) {
				//console.log(i.color, tailwindColorToHex(i.color));
				const isSigned = i?.signoffs?.length > 0;
				updateComponentColour(i?.reference, tailwindColorToHex(i?.color || 'orange-500'), 'TOP');
				updateComponentOutline(
					i?.reference,
					'TOP',
					isSigned ? tailwindColorToHex('green-400') : tailwindColorToHex('red-600'),
					isSigned ? 10 : 5
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
		//console.log('Update component outline:', reference, colour, group);
		if (!group) {
			//console.log('Update component outline colour:', 'NO GROUP', reference);
			return;
		}

		group?.find(`.outline`)?.forEach((c) => {
			//console.log('Update component outline:', c);
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
				updateComponentReferenceColor(component?.component, 'TOP', 'black', 1);
				//console.debug('COMPONENT OVER: ', component?.component, component, detail);
				//currentInfo = `${component?.component} (${component?.device})`;
			}
			if (eventType == 'mouseout') {
				updateComponentReferenceColor(component?.component, 'TOP', 'black', 0.75);
				//console.debug('COMPONENT OUT: ', component?.component, component, detail);
				//currentInfo = '';
			}
		}
		//console.log(`COMPONENT EVENT | ${eventType.toUpperCase()}:`, component);
	};

	let updateComponentReferenceColor = (
		reference: string,
		rendererId: string = 'TOP',
		colour: string,
		opacity: number = 1,
		size: number = 0
	) => {
		const group = getComponentGroup(reference, rendererId);
		//console.log('Update component reference:', reference, colour, group);
		if (!group) {
			//console.log('Update component reference:', 'NO GROUP', reference);
			return;
		}

		group?.find(`.reference`)?.forEach((c) => {
			//console.log('Update component reference:', c);
			if (colour) {
				c.fill(colour);
			}
			if (size) {
				c.fontSize(size);
			}
			if (opacity) {
				c.opacity(opacity);
			}
		});
	};

	let updateComponentColour = (
		reference: string,
		colour: string,
		rendererId: string = 'TOP',
		opacity: number = 1
	) => {
		let group = getComponentGroup(reference, rendererId);
		//console.log('Update component colour:', reference, colour, group);
		if (!group) {
			//console.log('Update component colour:', 'NO GROUP', reference);
			return;
		}
		if (colour == '') {
			group.find(`.outline`).forEach((c) => {
				//console.log('Update component colour:', c);
				//c.fillEnabled(false);
				c.fill('');
			});
			group.find(`.lead`).forEach((c) => {
				//console.log('Update component lead colour:', c);
				c.fillEnabled(false);
			});
			return;
		}
		group.find(`.outline`).forEach((c) => {
			//console.log('Update component colour:', c);
			c.fillEnabled(true);
			c.fill(colour);
			c.opacity(0.75);
		});
		group.find(`.lead`).forEach((c) => {
			//console.log('Update component lead colour:', c);
			c.fillEnabled(false);
			c.fill(colour);
		});
	};

	function onBoardItemClick(reference: string) {
		/* if (!Object.keys(user?.processes).includes(instruction?.type?.toLowerCase())) {
			alert(
				`You do not have permission to complete process of type: ${
					instruction?.type
				}. You have permi (${Object.keys(user?.profile?.roles?.processes)})`
			);
			return;
		} */
		const step = steps.filter((s) => s.reference === reference)?.[0];
		let e = { detail: { step: step } };
		handleStepClick(e);
		console.log(reference, step, e);
	}

	//INFO: Update CAD highlighting on steps change
	$: {
		if (steps) {
			draw_event();
		}
	}
</script>

{#if boardId}
	{#if !$boardInfoStore.data}
		<p>Loading...</p>
	{:else if $boardInfoStore.error}
		<p>Error: {$boardInfoStore.error.message}</p>
	{:else}
		<!-- <Blockquote border bg class="p-2 mb-1" borderClass="border-l-8 border-blue-900">
			{#if boardInfo?.job}
				<P weight="medium" size="2xl">EAS{boardInfo?.job?.batch}</P>
			{/if}
			<P weight="bold" size="xl">
				<span class="font-normal">{boardInfo?.job?.customer?.name}</span>
				{assembly?.name} ({assembly?.revision_external}:{assembly?.revision_internal}) [{assemblyId}]
			</P>
		</Blockquote> -->

		{#if boardInfo}
			<div class="flex max-h-[1065px]">
				<div class="w-2/3">
					<div>
						{#if instruction}
							<Blockquote
								border
								bg
								class="p-1 flex-auto mb-1 pb-2.5"
								borderClass={`border-l-8 ${
									!steps
										? 'border-gray-600'
										: complete === false
										? 'border-red-600'
										: 'border-green-400'
								}`}
							>
								<div class="flex">
									<div class="flex-none w-2/3">
										<P weight="bold" size="xl">{instruction?.name}: {instruction?.description}</P>
										<P weight="medium" size="sm">{instruction?.id} ({instruction?.revision})</P>
									</div>
									<div
										class="flex-1 w-fit float-right text-red-600"
										class:line-through={Object.keys(user?.processes)?.includes(instruction?.type)}
									>
										<Label>
											<Select
												class="mt-2 -mb-2 "
												placeholder=""
												items={instructions?.map((i) => {
													return { value: i.instruction.id, name: i.instruction.name };
												})}
												bind:value={instructionId}
											/>
										</Label>
									</div>
								</div>
							</Blockquote>
						{/if}
					</div>
					<div class="outline outline-slate-300 dark:bg-slate-500">
						<Viewer
							on:pin_event={pin_event}
							on:draw_done={draw_event}
							on:component_event={component_event}
							outlinePins={[1]}
							id="TOP"
							height={/* 675 */ 1000}
							data={cad}
							layerToShow="TOP"
						/>
					</div>
				</div>
				<div class="float-right px-1 w-1/3 overflow-y-auto">
					{#if instruction}
						<InstructionList
							on:header_click={handleHeaderClick}
							on:item_click={handleStepClick}
							on:item_mouse
							{instruction}
							{steps}
						/>
					{/if}
				</div>
			</div>
		{/if}
	{/if}
{:else}
	<p>No boardId</p>
{/if}
