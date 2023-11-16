<script lang="ts">
	import { supplier_export } from '$lib/utils';
	import { Select, Button, Toggle, Input } from 'flowbite-svelte';
	import { BarsArrowDown } from 'svelte-heros-v2';
	import UserIcon from '../UserIcon.svelte';
	import OrdersListItem from './OrdersListItem.svelte';
	import { queryStore, getContextClient, gql } from '@urql/svelte';

	export let order;
	export let showSupplierSelect: boolean = false;

	$: suppliersStore = queryStore({
		client: getContextClient(),
		query: gql`
			query suppliers {
				erp_suppliers(order_by: { name: asc }) {
					id
					name
					names
				}
			}
		`,
		variables: {}
	});
	$: suppliers = $suppliersStore?.data?.erp_suppliers;

	export let selectedSupplierId: undefined | string = order?.supplier?.id;
	//$: supplier = suppliers?.filter((s) => s?.id === selectedSupplierId)?.[0];
	$: console.log('OrderCreateHeader', order);
</script>

<div class="">
	<div class="flex col-span-3">
		<div class="cursor-pointer" on:click={() => (showSupplierSelect = !showSupplierSelect)}>
			<OrdersListItem {order} interactive={false}>
				{#if showSupplierSelect}
					<div class=" w-fit flex" on:click|stopPropagation={() => {}}>
						<div class="pl-2 my-auto">
							<Select
								size="sm"
								placeholder=""
								items={suppliers?.map((s) => {
									return { value: s.id, name: s.name };
								})}
								bind:value={selectedSupplierId}
								on:change={() => {
									showSupplierSelect = false;
									let supplier = suppliers?.filter((s) => s.id === selectedSupplierId)?.[0];
									//console.log(supplier);
									order.supplier.name = supplier.name;
									order.supplier.names = supplier.names;
									order.supplier.id = supplier.id;
									order.supplier_id = supplier?.id;
								}}
							/>
						</div>
						{#if Object.keys(supplier_export).includes(selectedSupplierId)}
							<div class="grid grid-rows-2 gap-y-1 my-auto">
								{#each Object.keys(supplier_export[selectedSupplierId]) as type}
									<div class="-my-2">
										<Button
											size="sm"
											class=" hover:text-green-600 text-sm"
											on:click={() => {
												supplier_export[selectedSupplierId][type](order);
											}}
										>
											<BarsArrowDown size="20" />
											<p class="text-xs">{type}</p>
										</Button>
									</div>
								{/each}
							</div>
						{/if}
						<div class="w-24 my-auto ml-2">
							<!-- <Label defaultClass="text-xs font-medium block">
                        Reference: -->
							<Input bind:value={order.reference} placeholder="Reference" size="sm" />
							<!-- </Label> -->
						</div>
					</div>
				{/if}
			</OrdersListItem>
		</div>
		<!-- <div class="pt-2 pl-2">
			<UserIcon size="sm" user={order?.user}>
				{order?.user?.first_name}
				{order?.user?.last_name}
			</UserIcon>
		</div> -->
	</div>
	<!-- <div class="flex flex-row ml-auto my-auto gap-1">
		<div />
		 <div class="flex gap-4">
			{#if jobListVisible}
				<Select items={jobs} bind:value={job} placeholder="Select job" size="sm" />
			{/if}
			<Toggle color="blue" bind:checked={jobListVisible}>Job</Toggle>
		</div> 
		<div class="my-auto">
			 <Button
				color="green"
				size="sm"
				disabled={orderAdding}
				on:click={() => {
					addOrder();
				}}
			>
				Create order
			</Button> 
		</div>
	</div> -->
</div>
