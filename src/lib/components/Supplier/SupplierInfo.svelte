<script lang="ts">
	import SupplierTags from './SupplierTags.svelte';

	import type { Supplier } from '$lib/types';
	import { getContextClient, gql, queryStore } from '@urql/svelte';
	import { Badge, Skeleton, Spinner } from 'flowbite-svelte';

	export let supplierId: string = '';
	export let supplier: Supplier | undefined = undefined;

	let supplierInfoStore;
	$: if (supplierId) {
		supplierInfoStore = queryStore({
			client: getContextClient(),
			query: gql`
				query supplierInfo($supplierId: String!) {
					erp_suppliers_by_pk(id: $supplierId) {
						id
						created_at
						updated_at
						name
						names
						user_id
						tags
						image_url
						categories
						url
					}
				}
			`,
			variables: { supplierId },
			requestPolicy: 'cache-and-network'
		});
	}

	$: supplierInfo = supplierId ? $supplierInfoStore?.data?.erp_suppliers_by_pk : supplier;
</script>

{#if $supplierInfoStore?.fetching}
	<div class="flex gap-x-2">
		<div>
			<Spinner size="6" color="gray" />
		</div>
		<div class="my-auto animate-pulse w-24">
			<div class="h-3 bg-gray-200 rounded-full dark:bg-gray-700" />
			<span class="sr-only">Loading...</span>
		</div>
	</div>
{:else if $supplierInfoStore?.error}
	<h1 class="text-red-600">Supplier query error</h1>
	<p class="text-red-600">{$supplierInfoStore.error.message}</p>
{:else if supplierInfo}
	<div class="flex gap-x-2">
		<div class="my-auto rounded-lg">
			<a href={supplierInfo?.url} target="_blank">
				{#if supplierInfo?.image_url}
					<img
						class="h-8 p-0.5 rounded-lg bg-gray-200"
						class:hidden={!supplierInfo?.image_url}
						src={supplierInfo?.image_url}
						alt={supplierInfo?.name}
					/>
				{:else}
					<p
						class="text-xl font-bold text-center w-8 p-0.5 rounded-lg bg-gray-200
						{supplierInfo?.id === 'STOCK' && 'bg-green-500 text-white'}
						{supplierInfo?.id === 'FI' && 'bg-yellow-300 text-white'}
						"
					>
						{supplierInfo?.name
							?.split(' ')
							?.map((s) => s?.[0]?.toUpperCase())
							.join('')}
					</p>
				{/if}
			</a>
		</div>
		<div class="my-auto">
			<p class="text-lg font-semibold leading-none text-gray-900 dark:text-white">
				<a href="/supplier/{supplierInfo.id}" class="hover:underline">{supplierInfo?.name}</a>
			</p>
			{#if supplierInfo?.categories?.length}
				<p class="text-xs font-normal whitespace-break-spaces">
					{supplierInfo?.categories?.map((c) => c?.[0]?.toUpperCase() + c?.substr(1))?.join(', ')}
				</p>
			{/if}
		</div>
	</div>
	{#if supplierInfo?.tags?.length}
		<div class="flex flex-wrap gap-1 ml-auto w-48 mt-2">
			<SupplierTags tags={supplierInfo?.tags} />
		</div>
	{/if}
{:else}
	<div class={'text-base font-semibold leading-none text-gray-900 dark:text-white'}>Supplier info unavailable...</div>
{/if}
