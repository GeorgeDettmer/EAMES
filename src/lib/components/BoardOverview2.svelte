<script lang="ts">
	import {
		Badge,
		Card,
		Tooltip,
		Timeline,
		TimelineItem,
		Hr,
		Listgroup,
		ListgroupItem,
		Accordion,
		Popover
	} from 'flowbite-svelte';
	import Progressbar from './Progressbar.svelte';
	import UserIcon from './UserIcon.svelte';
	import AccordionItem from './AccordionItem.svelte';
	import { CheckCircle, XCircle } from 'svelte-heros-v2';
	import { gql, getContextClient, subscriptionStore } from '@urql/svelte';
	import { padSerial } from '$lib/utils';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { page } from '$app/stores';
	import UserOverview from './UserOverview.svelte';
	import InstructionListItem from './InstructionListItem.svelte';

	export let boardId: string;
	$: boardId = $page?.data?.boardId;

	$: infoStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription StepsInfo($boardId: bigint!) {
				instructions {
					id
					name
					description
					stepsByInstructionId {
						id
						color
						notes
						part_id
						reference
						signoffs(where: { board_id: { _eq: $boardId } }) {
							id
							board_id
							user {
								id
								first_name
								last_name
								initials
								color
								processes
								username
							}
						}
					}
				}
			}
		`,
		variables: { boardId }
	});
	$: info = infoStore?.data?.instructions;
	$: console.log('-----------------------------------', infoStore);
</script>

{#if boardId}
	<!-- 	<pre>{JSON.stringify(instructions, null, 2)}</pre>
 -->
	{#if $infoStore.error}
		<p>Error: {$infoStore.error.name}</p>
		<pre>{JSON.stringify($infoStore.error, null, 2)}</pre>
	{:else if !$infoStore.data}
		<p>Loading...</p>
	{:else if info}
		<div class="p-8">
			<Card size="xl" padding="xl" class={isComplete ? 'ring-4 ring-green-400' : 'ring-4 ring-red-600'}>
				<div class="flow-root">
					<div class="flex float-left items-center">
						<p class="mb-2 md:text-4xl text-xl text-gray-900 dark:text-white justify-left">
							{padSerial(boardId)}
						</p>
					</div>
					<div class="flex float-right items-center ml-auto">
						{#if steps}
							{#if !isComplete}
								<h5 class="mr-2 text-3xl font-bold text-red-600">
									{incomplete}
								</h5>
								<XCircle size="50" class="text-red-600" />
							{:else}
								<CheckCircle size="50" class="text-green-400" />
							{/if}
						{/if}
					</div>
				</div>
				<Hr class="my-1" />
				<Progressbar
					progress={Math.round((100 / total || 0) * complete || 0)}
					size="h-6"
					labelInside
					labelInsideClass="text-white text-base font-medium text-center p-1 leading-none rounded-full"
					class="my-2 bg-red-600"
					color={'green'}
				/>

				<div class="flex">
					<div class="w-2/3 m-1">
						<Listgroup active>
							<h3 class="text-center bg-green-400 text-white font-bold rounded-t-lg">
								Complete ({complete}/{total})
							</h3>
							<Accordion flush multiple>
								{#each info as instruction}
									{#if instruction.signoffs?.length}
										<AccordionItem defaultClass="flex items-center justify-between w-full font-medium text-left">
											<span slot="header" class="text-base flex mx-2">
												<div class="flex">
													<CheckCircle size="25" class="text-green-400 mr-2" />
													<Badge color="green">{instruction.instruction.name}</Badge>
												</div>
												<div class="flex px-1">
													{#each instruction?.signoffs as signoff}<div class="px-1">
															<div id={signoff?.id}>
																<UserIcon user={signoff?.user} size="xs" />
															</div>
															<Popover
																style="z-index: 10000;"
																placement="right"
																trigger="hover"
																class="w-96 text-sm font-light text-gray-500 bg-white dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800"
															>
																<UserOverview userId={signoff?.user?.id} />
																<!-- <ActivityHistory stepId={item?.id} {boardId} /> -->
															</Popover>
														</div>
													{:else}{/each}
												</div>
											</span>
											<div class="flex overflow-hidden">
												<div class="ml-2 w-3/4">
													{#each instruction?.signoffs as signoff}
														<InstructionListItem item={signoff.step} />
														<Popover
															style="z-index: 10000;"
															placement="right"
															trigger="hover"
															class="w-96 text-sm font-light text-gray-500 bg-white dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800"
														>
															<UserOverview userId={signoff?.user?.id} />
															<!-- <ActivityHistory stepId={item?.id} {boardId} /> -->
														</Popover>
													{:else}{/each}
												</div>
												<div class="p-1 mr-2" />
											</div>
										</AccordionItem>
									{/if}
								{:else}
									<p class="text-lg text-center">No complete signoffs</p>
								{/each}
							</Accordion>
						</Listgroup>
					</div>
					<div class="w-1/3 m-1 float-right">
						<Listgroup active>
							<h3 class="text-center bg-red-600 text-white font-bold rounded-t-lg">
								Incomplete ({incomplete}/{total})
							</h3>
							{#each instructions as instruction}
								{#if !instruction.signoffs?.length}
									<ListgroupItem class="text-base font-semibold gap-2">
										<div class="flex">
											<XCircle size="25" class="text-red-600 mr-2" />
											<Badge color="red">{instruction.instruction.name}</Badge>
										</div>
									</ListgroupItem>
								{/if}
							{:else}
								<p class="text-lg text-center">No incomplete signoffs</p>
							{/each}
						</Listgroup>
					</div>
				</div>

				<div class="justify-center items-center space-y-4 sm:flex sm:space-y-0 sm:space-x-4" />
			</Card>
		</div>
	{/if}
	<hr />
	<div class="p-8">
		<Card size="xl" padding="xl" class={isComplete ? 'ring-4 ring-green-400' : 'ring-4 ring-red-600'}>
			<div class="flow-root">
				<div class="flex float-left items-center">
					<!-- <img
						alt="Board serial number"
						class="w-10 mr-2 justify-left"
						style:filter={'invert(0.5)'}
						src={'http://bwipjs-api.metafloor.com/?bcid=datamatrix&text=' + boardId}
					/> -->
					<p class="mb-2 md:text-4xl text-xl text-gray-900 dark:text-white justify-left">
						{padSerial(boardId)}
					</p>
				</div>
				<div class="flex float-right items-center ml-auto">
					{#if steps}
						{#if !isComplete}
							<h5 class="mr-2 text-3xl font-bold text-red-600">
								{incomplete}
							</h5>
							<XCircle size="50" class="text-red-600" />
						{:else}
							<CheckCircle size="50" class="text-green-400" />
						{/if}
					{/if}
				</div>
			</div>
			<Hr class="my-1" />
			<Progressbar
				progress={Math.round((100 / total || 0) * complete || 0)}
				size="h-6"
				labelInside
				labelInsideClass="text-white text-base font-medium text-center p-1 leading-none rounded-full"
				class="my-2 bg-red-600"
				color={'green'}
			/>

			<div class="flex">
				<div class="w-2/3 m-1">
					<Listgroup active>
						<h3 class="text-center bg-green-400 text-white font-bold rounded-t-lg">
							Complete ({complete}/{total})
						</h3>
						<Accordion flush multiple>
							{#each completeList as [key, value]}
								<AccordionItem defaultClass="flex items-center justify-between w-full font-medium text-left">
									<span slot="header" class="text-base flex mx-2">
										<div class="flex">
											<CheckCircle size="25" class="text-green-400 mr-2" />
											<Badge color="green">{key}</Badge>
										</div>
										<div class="flex ml-auto">
											<!-- {#each value?.signoffs as signoff}
											<UserIcon user={signoff.user} size="xs" />
										{:else}{/each} -->
										</div>
									</span>
									<div class="flex overflow-hidden">
										<div class="ml-2 w-3/4">
											{#each value?.signoffs as signoff}
												<pre>{JSON.stringify(signoff?.user, null, 2)}</pre>
												<!-- <span>
													 <UserIcon {user} size="xs">
													{user?.profile?.name
														? [user.profile?.name?.first, user.profile?.name?.last].join(' ')
														: '??'}
												</UserIcon> 
												</span>
												{#each signoff as user}
													<span>
														{user}
														<UserIcon {user} size="xs">
															{[user?.firstname, user?.lastname].join(' ')}
														</UserIcon>
													</span>
												{/each} -->
											{/each}
										</div>
										<div class="p-1 mr-2">
											<!-- <Viewer
											id={data[0]._id}
											height={250}
											width={500}
											data={data[0]}
											style={signoff?.user?.profile?.colour
												? `box-shadow:${signoff?.user?.profile?.colour} 0 0 0 3px`
												: ''}
										/> -->
										</div>
									</div>
								</AccordionItem>
							{:else}
								<p class="text-lg text-center">No complete signoffs</p>
							{/each}
						</Accordion>
					</Listgroup>
				</div>
				<div class="w-1/3 m-1 float-right">
					<Listgroup active>
						<h3 class="text-center bg-red-600 text-white font-bold rounded-t-lg">
							Incomplete ({incomplete}/{total})
						</h3>
						{#each incompleteList as [key, value]}
							<ListgroupItem class="text-base font-semibold gap-2">
								<div class="flex">
									<XCircle size="25" class="text-red-600 mr-2" />
									<Badge color="red">{key}</Badge>
								</div>
							</ListgroupItem>
						{:else}
							<p class="text-lg text-center">No incomplete signoffs</p>
						{/each}
					</Listgroup>
				</div>
			</div>

			<div class="justify-center items-center space-y-4 sm:flex sm:space-y-0 sm:space-x-4" />
		</Card>
	</div>
{/if}
