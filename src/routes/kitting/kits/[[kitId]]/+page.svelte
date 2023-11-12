<script lang="ts">
	import { page } from '$app/stores';
	import { queryStore, getContextClient, gql } from '@urql/svelte';
	import type { PageData } from './$types';
	import {
		Accordion,
		AccordionItem,
		Badge,
		Button,
		Popover,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { onMount, tick } from 'svelte';
	import PartInfo from '$lib/components/PartInfo.svelte';
	import { ChevronDoubleDown, ChevronDoubleUp } from 'svelte-heros-v2';
	import { EllipseHorizontalSolid, PlusSolid } from 'flowbite-svelte-icons';
	import OrdersListItem from '$lib/components/Orders/OrdersListItem.svelte';

	export let data: PageData;

	$: kitIds = $page?.data?.kitId?.split(',')?.filter((id) => isNaN(Number(id))) || [];
	$: jobIds =
		$page?.data?.kitId
			?.split(',')
			?.filter((id) => !isNaN(Number(id)))
			?.map((id) => Number(id)) || [];
	$: kitsStore = queryStore({
		client: getContextClient(),
		query: gql`
			query kits($id: uuid_comparison_exp = {}) {
				erp_kits(where: { _or: { id: $id } }) {
					id
					kits_items {
						id
						part
						part_id
						quantity
						updated_at
						user {
							id
							first_name
							last_name
							username
							initials
							color
						}
						orders_item {
							id
							quantity
							price
							order {
								id
								reference
								supplier {
									id
									name
								}
								orders_items {
									id
									price
									quantity
								}
							}
						}
					}
					jobs_kits {
						job_id
					}
				}
			}
		`,
		variables: {
			id: kitIds && kitIds.length > 0 ? { _in: kitIds } : {}
		},
		requestPolicy: 'cache-and-network'
	});

	$: console.log('kitsStore', $kitsStore, kitIds, kitIds ? { _in: kitIds } : {}, accordionState);
	$: console.log('jobIds', jobIds, jobIds && jobIds.length > 0 ? { _in: jobIds } : {});
	$: kits = $kitsStore?.data?.erp_kits;

	let highlightAccordionIdx: undefined | number = undefined;
	let accordionState: boolean[] = [];
	function toggleAccordions(open: boolean | undefined = undefined) {
		accordionState.forEach((v, i) => {
			accordionState[i] = open === undefined ? !accordionState[i] : open;
		});
	}
	onMount(() => {
		if (kitIds.lenght > 0) {
			accordionState.fill(true);
		}
	});

	let searchVisible = false;
	let searchInput;
	let searchValue: string = '';
</script>

{#if $kitsStore.fetching}
	<p>Loading...</p>
{:else if $kitsStore.error}
	<h1 class="text-red-600">Part query error</h1>
	<p class="text-red-600">{$kitsStore.error.message}</p>
{:else if kits}
	<div class="flex">
		<div class="w-full my-auto">
			<div class="flex" class:hidden={kitIds.length === 0}>
				{#each kits as { id }, kit_idx}
					<div
						class="m-0.5 cursor-pointer"
						on:mouseenter={() => {
							highlightAccordionIdx = kit_idx;
						}}
						on:mouseleave={() => {
							highlightAccordionIdx = undefined;
						}}
					>
						<Badge
							color="blue"
							large
							dismissable
							on:dismiss={() => {
								kitIds = kitIds.filter((i) => i !== id);
							}}
						>
							<p
								class="uppercase"
								class:underline={accordionState[kit_idx]}
								on:click={() => {
									accordionState = accordionState.map((a, i) => (i === kit_idx ? !a : a));
								}}
							>
								{id.split('-').slice(-1)}
							</p>
						</Badge>
					</div>
				{:else}{/each}
				<div class="my-auto pl-2 flex">
					{#if searchVisible}
						<input
							type="text"
							class="block w-full disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
							bind:this={searchInput}
							bind:value={searchValue}
							on:keydown={(e) => {
								if (e.key === 'Escape') {
									searchVisible = false;
								}
								if (e.key === 'Enter') {
									if (isNaN(Number(searchValue))) {
										kitIds = [searchValue, ...kitIds];
									} else {
										jobIds = [searchValue, ...jobIds];
									}
								}
							}}
							on:focusout={() => {
								searchVisible = false;
								searchValue = '';
							}}
						/>
					{/if}
					<!-- <Button
						size="xs"
						color="green"
						on:click={() => {
							if (!searchVisible) {
								searchVisible = true;
							} else {
								//Submit here
								searchVisible = false;
							}
						}}
					>
						<PlusSolid size="xs" />
					</Button> -->
				</div>
			</div>
		</div>
		<div class="my-auto m-2">
			<Button color="blue" size="sm">Create kit</Button>
		</div>
		<div class="my-auto ml-2 -mr-1 hover:cursor-pointer">
			<ChevronDoubleUp
				on:click={() => {
					toggleAccordions(false);
				}}
			/>
			<EllipseHorizontalSolid
				on:click={() => {
					toggleAccordions();
				}}
			/>
			<ChevronDoubleDown
				on:click={() => {
					toggleAccordions(true);
				}}
			/>
		</div>
	</div>

	<Accordion multiple>
		{#each kits as kit, kit_idx}
			{@const kits_items = kit?.kits_items || []}
			<AccordionItem paddingFlush="p-0" paddingDefault="p-4" bind:open={accordionState[kit_idx]}>
				<div slot="header" class="grid grid-cols-2">
					<p
						class="uppercase"
						class:underline={highlightAccordionIdx === kit_idx}
						class:text-blue-600={highlightAccordionIdx === kit_idx}
					>
						{kit.id.split('-').slice(-1)}
					</p>
					{#if kit?.jobs_kits?.length > 0}
						{#each kit?.jobs_kits as job}
							<div class="pl-2">
								<Badge border color="blue">{job.job_id}</Badge>
								<div class:bg-blue-600={true} class="w-6 h-6 center rounded-full inline-flex items-center justify-center">
									<p class="text-white">{kits_items.length}</p>
								</div>
							</div>
						{/each}
					{/if}
				</div>
				<div class="p-1">
					<p>{kit.id}/{kit.jobs_kits.map((k) => k.job_id)}: {kit.kits_items.length}</p>
				</div>
				<Table>
					<TableHead>
						<TableHeadCell>#</TableHeadCell>
						<TableHeadCell>Part</TableHeadCell>
						<TableHeadCell>Order</TableHeadCell>
						<TableHeadCell>Quantity</TableHeadCell>
					</TableHead>
					<TableBody>
						{#each kits_items as item, item_idx}
							<TableBodyRow on:click={() => (item.__open = !item.__open)}>
								<TableBodyCell>{item_idx + 1}</TableBodyCell>
								<TableBodyCell>{item.part}</TableBodyCell>
								<TableBodyCell>
									<Badge class="cursor-pointer" color={item.orders_item.order.id ? 'blue' : 'dark'}>
										{item.orders_item.order.id || 'N/A'}
									</Badge>
									<Popover placement="left">
										<OrdersListItem order={item.orders_item.order} />
									</Popover>
								</TableBodyCell>
								<TableBodyCell>{item.quantity}</TableBodyCell>
							</TableBodyRow>
							{#if item?.__open}
								<TableBodyRow class="shadow-inner">
									<TableBodyCell colspan="1" />
									<TableBodyCell colspan="1">
										<div class="px-1 py-1">
											{#if item?.part_id}
												<PartInfo partId={item.part_id} showPopoutButton={true} />
											{/if}
										</div>
									</TableBodyCell>
									<TableBodyCell colspan="1" />
								</TableBodyRow>
							{/if}
						{:else}
							<TableBodyRow>
								<TableBodyCell colspan="3">No items assigned to this kit</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
					<TableHead>
						<TableHeadCell>{kits_items.length}</TableHeadCell>
						<TableHeadCell />
						<TableHeadCell />
						<TableHeadCell>{kits_items.reduce((a, v) => (a = a + v.quantity), 0)}</TableHeadCell>
					</TableHead>
				</Table>
			</AccordionItem>
		{/each}
	</Accordion>
{/if}
