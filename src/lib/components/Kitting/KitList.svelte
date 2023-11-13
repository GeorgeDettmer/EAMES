<script lang="ts">
	import {
		Badge,
		Accordion,
		AccordionItem,
		Table,
		TableHead,
		TableHeadCell,
		TableBody,
		TableBodyRow,
		TableBodyCell,
		Popover
	} from 'flowbite-svelte';
	import { EllipseHorizontalSolid } from 'flowbite-svelte-icons';
	import { ChevronDoubleUp, ChevronDoubleDown, XMark } from 'svelte-heros-v2';
	import OrdersListItem from '../Orders/OrdersListItem.svelte';
	import PartInfo from '../PartInfo.svelte';
	import KitItemRemoveButton from './KitItemRemoveButton.svelte';

	export let kits = [];
	export let highlightAccordionIdx: undefined | number = undefined;
	export let accordionState: boolean[] = [];
	export let showAccordionToggles: boolean = false;
	export let allowEdit: boolean = true;

	function toggleAccordions(open: boolean | undefined = undefined) {
		accordionState.forEach((v, i) => {
			accordionState[i] = open === undefined ? !accordionState[i] : open;
		});
	}
	/* onMount(() => {
		if (kitIds.lenght > 0) {
			accordionState.fill(true);
		}
	}); */
</script>

{#if showAccordionToggles}
	<div class="flex">
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
{/if}

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
				<p>{kit.id}/{kit?.jobs_kits?.map((k) => k.job_id)}: {kit.kits_items.length}</p>
			</div>
			<Table hoverable>
				<TableHead>
					<TableHeadCell>#</TableHeadCell>
					<TableHeadCell>Part</TableHeadCell>
					<TableHeadCell>Order</TableHeadCell>
					<TableHeadCell>Quantity</TableHeadCell>
					{#if allowEdit}
						<TableHeadCell />
					{/if}
				</TableHead>
				<TableBody>
					{#each kits_items as item, item_idx}
						<TableBodyRow on:click={() => (item.__open = !item.__open)} class="cursor-pointer">
							<TableBodyCell>{item_idx + 1}</TableBodyCell>
							<TableBodyCell>{item.part}</TableBodyCell>
							<TableBodyCell>
								<Badge class="cursor-pointer" color={item.orders_item?.order?.id ? 'blue' : 'dark'}>
									{item?.orders_item?.order?.id || 'N/A'}
								</Badge>
								{#if item?.orders_item?.order}
									<Popover placement="left">
										<OrdersListItem order={item.orders_item.order} />
									</Popover>
								{/if}
							</TableBodyCell>
							<TableBodyCell>{item.quantity}</TableBodyCell>
							{#if allowEdit}
								<TableBodyCell>
									<KitItemRemoveButton id={item.id}><XMark size="16" /></KitItemRemoveButton>
								</TableBodyCell>
							{/if}
						</TableBodyRow>
						{#if item?.__open}
							<TableBodyRow class="shadow-inner">
								<TableBodyCell colspan="1" />
								<TableBodyCell colspan="1">
									<div class="px-1 py-1">
										{#if item?.part_id}
											<PartInfo partId={item.part_id} />
										{/if}
									</div>
								</TableBodyCell>
								<TableBodyCell colspan="2" />
							</TableBodyRow>
						{/if}
					{:else}
						<TableBodyRow>
							<TableBodyCell colspan="5">No items assigned to this kit</TableBodyCell>
						</TableBodyRow>
					{/each}
				</TableBody>
				<TableHead>
					<TableHeadCell>{kits_items.length}</TableHeadCell>
					<TableHeadCell />
					<TableHeadCell />
					<TableHeadCell>{kits_items.reduce((a, v) => (a = a + v.quantity), 0)}</TableHeadCell>
					<TableHeadCell />
				</TableHead>
			</Table>
		</AccordionItem>
	{/each}
</Accordion>
