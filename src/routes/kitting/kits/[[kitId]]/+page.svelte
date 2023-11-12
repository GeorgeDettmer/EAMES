<script lang="ts">
	import { page } from '$app/stores';
	import { queryStore, getContextClient, gql } from '@urql/svelte';
	import type { PageData } from './$types';
	import {
		Accordion,
		AccordionItem,
		Badge,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import PartInfo from '$lib/components/PartInfo.svelte';
	import { ChevronDoubleDown, ChevronDoubleUp } from 'svelte-heros-v2';
	import { EllipseHorizontalSolid } from 'flowbite-svelte-icons';

	export let data: PageData;

	$: kitIds = $page?.data?.kitId?.split(',');
	$: kitsStore = queryStore({
		client: getContextClient(),
		query: gql`
			query kits($id: uuid_comparison_exp = {}) {
				erp_kits(where: { id: $id }) {
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
							order {
								id
								supplier {
									id
									name
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
	$: kits = $kitsStore?.data?.erp_kits;

	let accordionState: boolean[] = [];
	function toggleAccordions(open: boolean | undefined = undefined) {
		accordionState.forEach((v, i) => {
			accordionState[i] = open === undefined ? !accordionState[i] : open;
		});
	}
	onMount(() => {
		if (kitIds) {
			accordionState.fill(true);
		}
	});
</script>

{#if $kitsStore.fetching}
	<p>Loading...</p>
{:else if $kitsStore.error}
	<h1 class="text-red-600">Part query error</h1>
	<p class="text-red-600">{$kitsStore.error.message}</p>
{:else if kits}
	<div class="flex">
		<div class="w-full my-auto">
			<div class="flex">
				{#each kits as { id }}
					<div class="m-0.5">
						<Badge
							color="blue"
							large
							dismissable
							on:dismiss={() => {
								kitIds = kitIds.filter((i) => i !== id);
							}}
						>
							<p class="uppercase">{id.split('-').slice(-1)}</p>
						</Badge>
					</div>
				{:else}{/each}
			</div>
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
				<div slot="header" class="grid grid-cols-2 h-28">
					<p class="uppercase">{kit.id.split('-').slice(-1)}</p>
					{#if kit?.jobs_kits?.length > 0}
						{#each kit?.jobs_kits as job}
							<div class="pl-2">
								<Badge border color="blue">{job.job_id}</Badge>
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
						<TableHeadCell>Quantity</TableHeadCell>
					</TableHead>
					<TableBody>
						{#each kits_items as item, item_idx}
							<TableBodyRow on:click={() => (item.__open = !item.__open)}>
								<TableBodyCell>{item_idx + 1}</TableBodyCell>
								<TableBodyCell>{item.part}</TableBodyCell>
								<TableBodyCell>{item.quantity}</TableBodyCell>
							</TableBodyRow>
							{#if item?.__open}
								<TableBodyRow class="shadow-inner">
									<TableBodyCell colspan="1" />
									<TableBodyCell colspan="1">
										<div class="px-1 py-1">
											{#if item?.part_id}
												<PartInfo partId={item.part_id} showPopoutButton={false} />
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
						<TableHeadCell>{kits_items.reduce((a, v) => (a = a + v.quantity), 0)}</TableHeadCell>
					</TableHead>
				</Table>
			</AccordionItem>
		{/each}
	</Accordion>
{/if}
