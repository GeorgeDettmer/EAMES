<script lang="ts">
	import { supplier_export } from '$lib/utils';
	import { Select, Button, Toggle, Input, Badge } from 'flowbite-svelte';
	import { BarsArrowDown } from 'svelte-heros-v2';
	import UserIcon from '../UserIcon.svelte';
	import OrdersListItem from './OrdersListItem.svelte';
	import { queryStore, getContextClient, gql } from '@urql/svelte';
	import { DotsHorizontalOutline, DotsVerticalOutline } from 'flowbite-svelte-icons';
	import type { Supplier } from '$lib/types';

	export let order;
	export let showSupplierSelect: boolean = false;
	export let suppliers: Supplier[] = [];
	export let showSetOrderId: boolean = false;
	/* $: suppliersStore = queryStore({
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
	$: suppliers = $suppliersStore?.data?.erp_suppliers; */

	export let selectedSupplierId: undefined | string = order?.supplier?.id;
	let supplier = order?.supplier;
	//$: supplier = suppliers?.filter((s) => s?.id === selectedSupplierId)?.[0];
	$: console.log('OrderCreateHeader', order);
</script>

<div class="">
	<div class="flex col-span-3">
		<div class="cursor-pointer">
			<OrdersListItem {order} interactive={false}>
				<div class="-mt-6 pl-2" on:click={() => (showSupplierSelect = !showSupplierSelect)}>
					{#if showSupplierSelect}
						<DotsVerticalOutline size="xs" />
					{:else}
						<DotsHorizontalOutline size="xs" />
					{/if}
				</div>
				{#if showSupplierSelect}
					<div class=" w-fit flex" on:click|stopPropagation={() => {}}>
						<div class="pl-2 my-auto space-y-0.5">
							<Select
								defaultClass="py-0 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
								size="sm"
								placeholder=""
								items={suppliers?.map((s) => {
									return { value: s.id, name: s.name };
								})}
								bind:value={selectedSupplierId}
								on:change={() => {
									//showSupplierSelect = false;
									supplier = suppliers?.filter((s) => s.id === selectedSupplierId)?.[0];
									//console.log(supplier);
									order.supplier = supplier;
									order.supplier.name = supplier.name;
									order.supplier.names = supplier.names;
									order.supplier.id = supplier.id;
									order.supplier_id = supplier?.id;
								}}
							/>
							{#if supplier}
								<div class="flex gap-x-2">
									<div class="my-auto rounded-lg">
										<a href={supplier?.url} target="_blank">
											{#if supplier?.image_url}
												<img
													class="h-6 p-0.5 rounded-lg bg-gray-200"
													class:hidden={!supplier?.image_url}
													src={supplier?.image_url}
													alt={supplier?.name}
												/>
											{:else}
												<p
													class="font-bold text-center w-6 p-0.5 rounded-lg text-gray-500 bg-gray-200
												{supplier?.id === 'STOCK' && 'bg-green-500 text-white'}
												{supplier?.id === 'FI' && 'bg-yellow-300 text-white'}
												"
												>
													{supplier?.name
														?.split(' ')
														?.map((s) => s?.[0]?.toUpperCase())
														.join('')}
												</p>
											{/if}
										</a>
									</div>
									<div class="my-auto">
										<div class="flex gap-x-2">
											<div class="flex gap-x-1 ml-auto">
												{#if supplier?.critical}
													<!-- <Badge rounded border color={'yellow'}>
													<p class="text-xs font-bold">!</p>
												</Badge> -->
													Critical
												{/if}
												{#if supplier?.risk_level}
													<Badge
														rounded
														border
														color={supplier?.risk_level === 'HIGH'
															? 'red'
															: supplier?.risk_level === 'MEDIUM'
															? 'yellow'
															: 'blue'}
													>
														<p class="text-xs font-bold text-center">{supplier?.risk_level?.[0]}</p>
													</Badge>
												{/if}
											</div>
										</div>

										<!-- {#if supplier?.categories?.length}
											<p class="text-xs font-normal whitespace-break-spaces">
												{supplier?.categories?.map((c) => c?.[0]?.toUpperCase() + c?.substr(1))?.join(', ')}
											</p>
										{/if} -->
									</div>
								</div>
							{/if}
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
											<BarsArrowDown size="20" class="text-gray-700 dark:text-gray-200" />
											<p class="text-xs text-gray-800 dark:text-gray-200">{type}</p>
										</Button>
									</div>
								{/each}
							</div>
						{/if}
						<div class="w-24 my-auto ml-2">
							<!-- <Label defaultClass="text-xs font-medium block">
                        Reference: -->
							<input
								type="text"
								class="block h-4 w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-0.5"
								bind:value={order.reference}
								placeholder="Reference"
							/>
							{#if showSetOrderId}
								<input
									type="number"
									class="block h-4 w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-0.5"
									bind:value={order.id}
									placeholder="PO"
								/>
							{/if}
							<input
								type="currency"
								class="block h-4 w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-0.5"
								bind:value={order.price}
								placeholder="Shipping cost"
							/>
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
