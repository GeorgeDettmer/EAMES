<script lang="ts">
	export let data;
	import { page } from '$app/stores';
	import { tailwindColors, truncateString } from '$lib/utils';
	import { gql, getContextClient, subscriptionStore } from '@urql/svelte';

	import { Blockquote, P, Label, Select, Modal } from 'flowbite-svelte';

	import InstructionList from '$lib/components/InstructionList.svelte';
	import Viewer, { getRenderers, getComponentGroup } from '$lib/components/Viewer.svelte';
	import { getContext } from 'svelte';
	import ComponentDetail from '$lib/components/ComponentDetail.svelte';
	import InstructionListHeader from '$lib/components/InstructionListHeader.svelte';

	let instructionId = data?.instructionId;
	let boardId = data?.boardId;

	const urqlClient = getContextClient();

	function handleHeaderClick(e) {
		console.log('LIST HEADER CLICK', e);
	}

	const componentOutlineSize = 15;

	function getOutlineSize(signed: boolean = false, hover: boolean = false) {
		if (signed && !hover) {
			return componentOutlineSize * 2;
		} else if (signed && hover) {
			return componentOutlineSize * 3;
		} else if (!signed && hover) {
			return componentOutlineSize * 1.5;
		}
		return componentOutlineSize;
	}

	function handleStepMouse(e: CustomEvent) {
		const detail = e?.detail;
		const event = detail?.event;
		const eventType = event?.type;
		const step = detail?.step;
		const signoffs = step?.signoffs;
		const signed = signoffs.length > 0;
		const renderGroup = getComponentGroup(step?.reference);
		const layer = renderGroup?.attrs?.layer;

		if (eventType == 'mousedown') {
			//onBoardItemClick(step?.reference);
		} else if (eventType == 'mouseenter') {
			if (renderGroup) {
				visibleLayer = layer;
				updateComponentOutline(step?.reference, layer, undefined, getOutlineSize(signed, true));
				renderGroup.zIndex(renderGroup.zIndex() * 2);
			}
		} else if (eventType == 'mouseleave') {
			if (renderGroup) {
				updateComponentOutline(step?.reference, layer, undefined, getOutlineSize(signed, false));
				renderGroup.zIndex(renderGroup.zIndex() / 2);
			}
		} else if (eventType == 'wheel') {
		} else {
			console.warn('Unhandled', e);
		}
	}
	async function handleStepClick(e) {
		const step = e.detail?.step;
		const signoffs = step?.signoffs;
		const signed = signoffs.length > 0;
		console.log('STEP CLICK', signed ? '✅' : '❌', step);
		if (signoffs?.filter((s) => s.user.id === user?.id).length > 0) {
			console.warn('USER ALREADY SIGNED OFF FOR STEP', step);
		} else {
			if (!allowedProcesses.flat().includes(instruction?.type?.toLowerCase())) {
				alert(
					`You do not have permission to complete process of type: ${
						instruction?.type
					}. You have permission for: ${allowedProcesses.map((p) => p[0]?.toUpperCase())}`
				);
				return;
			}
		}
		let mutationResult;
		if (!signed) {
			mutationResult = await urqlClient.mutation(
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

			console.log(mutationResult);
		} else {
			mutationResult = await urqlClient.mutation(
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
				//updateComponentOutline(step?.reference, visibleLayer, tailwindColorToHex('red-600'), 5);
			}
		}
		console.log(mutationResult);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			alert('DATABASE ERROR: ' + mutationResult?.error);
		} else {
			updateComponentOutline(
				step?.reference,
				visibleLayer,
				tailwindColorToHex(signed ? 'green-400' : 'red-600'),
				getOutlineSize(signed)
			);
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
							start_x
							start_y
							start_scale
							layers
							meta
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
					order_by: [{ part_id: asc_nulls_first }, { reference: asc }]
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
					dynamic
					meta
				}
			}
		`,
		variables: { assemblyId, boardId }
	});

	$: allSteps = $stepsInfoStore?.data?.steps;
	$: steps = allSteps?.filter((s) => s?.instruction_id === instructionId);
	$: stepsComplete = steps?.filter((i) => i?.signoffs?.length > 0);
	$: stepsIncomplete = steps?.filter((i) => i?.signoffs?.length === 0);
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
	$: console.info('PROCESSES', processes, allowedProcesses);

	let tailwindColorToHex = (color: string) => {
		let c = color.split('-');
		return tailwindColors?.[c?.[0]]?.[c?.[1]] || '#fff4';
	};

	let visibleLayer: string = $page?.data?.layer || 'TOP';
	console.warn('visibleLayer', visibleLayer);
	let draw_event = (e) => {
		const stepReference = stepsIncomplete?.[0]?.reference || steps?.[0]?.reference;
		if (!visibleLayer) {
			visibleLayer = cad?.data?.COMPONENTS?.filter((c) => stepReference === c?.component)?.[0]
				?.layer;
		}
		getRenderers().forEach((r, k) => {
			const scale = cad?.start_scale ? cad.start_scale / 100 : 0.4;
			const x = cad?.start_x ? cad.start_x : 215;
			const y = cad?.start_y ? cad.start_y : 900;
			const bb = r.find(`.bounds`)?.[0];
			const width = bb?.attrs?.width;
			console.info('UPDATE', k, width, bb);
			//Fill board to screen https://codepen.io/spark25/pen/VwXvZpp
			r.scaleX(scale);
			r.scaleY(scale);
			r.setPosition({ x: k === 'TOP' ? x : x * 3, y: y });
		});
		steps?.forEach((i) => {
			if (i?.reference && i?.color) {
				const isSigned = i?.signoffs?.length > 0;
				let rendererId = visibleLayer;
				//TODO: Look to improve this. Below is finding the component group just to find id
				// Then passing to updateComponent* just for those functions to do that again...
				getRenderers().forEach((r, id) => {
					if (getComponentGroup(i?.reference, id)) {
						rendererId = id;
						return;
					}
				});
				updateComponentColour(
					i?.reference,
					tailwindColorToHex(i?.color || 'orange-500'),
					rendererId
				);
				updateComponentOutline(
					i?.reference,
					rendererId,
					isSigned ? tailwindColorToHex('green-400') : tailwindColorToHex('red-600'),
					getOutlineSize(isSigned)
				);
			}
		});
		//console.log('DRAW DONE', e ?? '');
		/*  */
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
		if (eventType == 'mouseover') {
			updateComponentReferenceColor(component?.component, visibleLayer, 'black', 1);
		}
		if (eventType == 'mouseout') {
			updateComponentReferenceColor(component?.component, visibleLayer, 'black', 0.5);
		}
	};

	let updateComponentOutline = (
		reference: string,
		rendererId: string = visibleLayer,
		colour?: string,
		width?: number,
		opacity?: number
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

	let activeReference = '';
	let component_event = (e) => {
		let event = e?.detail?.event;
		let eventType = event?.type;
		let detail = e?.detail;
		let component = detail?.component;
		if (detail?.pin_idx == undefined) {
			if (eventType == 'mousedown') {
				detailVisible = null;
				console.log('COMPONENT CLICK: ', component?.component, component, detail);
				if (event.evt.altKey) {
					detailVisible = detail;
				}
				if (!event.evt.altKey) {
					onBoardItemClick(component?.component);
				}
			}
			if (eventType == 'mouseover') {
				updateComponentReferenceColor(component?.component, visibleLayer, 'black', 1);
				activeReference = component?.component;
				getComponentGroup(activeReference)
					?.find(`.reference`)
					?.forEach((c) => {
						c.text(activeReference);
					});
				//console.debug('COMPONENT OVER: ', component?.component, component, detail);
				//currentInfo = `${component?.component} (${component?.device})`;
			}
			if (eventType == 'mouseout') {
				activeReference = '';
				updateComponentReferenceColor(component?.component, visibleLayer, 'black', 0.5);
				getComponentGroup(component?.component)
					?.find(`.reference`)
					?.forEach((c) => {
						c.text(truncateString(component?.component));
					});
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
		const step = steps.filter((s) => s.reference === reference)?.[0];
		let e = { detail: { step: step } };
		if (!step) return;
		console.log(reference, step, e);
		handleStepClick(e);
	}

	//INFO: Update CAD highlighting on steps change
	$: {
		if (cad && steps) {
			draw_event();
		}
	}
	$: {
		if (cad) {
			/* getRenderers().forEach((r, k) => {
				const scale = cad?.start_scale ? cad.start_scale / 100 : 0.4;
				const x = cad?.start_x ? cad.start_x : 215;
				const y = cad?.start_y ? cad.start_y : 900;
				const bb = r.find(`.bounds`)?.[0];
				const width = bb?.attrs?.width;
				console.info('UPDATE', k, width, bb);

				r.scaleX(scale);
				r.scaleY(scale);
				r.setPosition({ x: k === 'TOP' ? x : x * 3, y: y });
			}); */
		}
	}

	let detailVisible = null;
</script>

{#if boardId}
	{#if $boardInfoStore.error}
		<p>Error: {$boardInfoStore.error.name}</p>
		<pre>{JSON.stringify($boardInfoStore.error, null, 2)}</pre>
	{:else if !$boardInfoStore.data}
		<p>Loading...</p>
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
			<div class="flex max-h-[825px]">
				<div class="w-2/3 hidden md:block">
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
										<P weight="bold" size="xl"
											>{instruction?.name}{instruction?.description
												? `: ${instruction?.description}`
												: ''}</P
										>
										<P weight="medium" size="sm">{instruction?.id} ({instruction?.revision})</P>
									</div>
									<div
										class="flex-1 w-fit float-right text-red-600"
										class:line-through={!processes?.[instruction?.type?.toLowerCase()]}
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
					<div class="md:block">
						<div class="outline outline-slate-300 dark:bg-slate-500">
							<div>
								{#each cad?.layers as layer (layer)}
									<div class:hidden={layer !== visibleLayer}>
										<div class="flex">
											<!-- svelte-ignore a11y-click-events-have-key-events -->
											<h1
												on:click={() => {
													visibleLayer = visibleLayer === 'TOP' ? 'BOTTOM' : 'TOP';
												}}
												class="cursor-pointer text-3xl font-bold opacity-50 z-50 p-1 hover:opacity-100"
											>
												{layer.substring(0, 3)}
											</h1>
											<div class="ml-auto float-right">
												<h1 class="text-3xl font-bold opacity-50 p-1">
													{activeReference}
												</h1>
											</div>
										</div>
										<Viewer
											on:pin_event={pin_event}
											on:draw_done={draw_event}
											on:component_event={component_event}
											drawAllPins={cad?.meta?.drawAllPins === undefined
												? true
												: cad?.meta?.drawAllPins}
											highlightPins={cad?.meta?.highlightPins || []}
											outlinePins={cad?.meta?.outlinePins || [1]}
											id={layer}
											height={750}
											data={cad}
											layerToShow={layer}
										/>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
				<div class="md:w-1/3 float-right px-1">
					{#if instruction?.meta?.externalSource}
						<div class="w-1/2 float-right">
							<InstructionList
								on:header_click={handleHeaderClick}
								on:item_click={handleStepClick}
								on:item_mouse={handleStepMouse}
								{instruction}
								{steps}
								{activeReference}
							/>
						</div>
						<div class="w-1/2 float-right">
							<InstructionList
								on:header_click={handleHeaderClick}
								on:item_click={handleStepClick}
								on:item_mouse={handleStepMouse}
								{instruction}
								{steps}
								{activeReference}
							/>
						</div>
					{:else if instruction}
						<InstructionListHeader on:header_click={handleHeaderClick} {steps} {instruction} />
						{#if detailVisible}
							<div>
								<ComponentDetail
									json={detailVisible.event.target.toJSON()}
									component={detailVisible}
									on:back={() => (detailVisible = null)}
								/>
							</div>
						{:else}
							<InstructionList
								on:header_click={handleHeaderClick}
								on:item_click={handleStepClick}
								on:item_mouse={handleStepMouse}
								{instruction}
								{steps}
								{activeReference}
							/>
						{/if}
					{/if}
				</div>
			</div>
		{/if}
	{/if}
{:else}
	<p>No boardId</p>
{/if}
