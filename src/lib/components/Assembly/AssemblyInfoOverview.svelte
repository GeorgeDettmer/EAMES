<script lang="ts">
	import { page } from '$app/stores';
	import BomTable from '$lib/components/BOM/BomTable.svelte';
	import Viewer, { getComponentGroups } from '$lib/components/Viewer.svelte';
	import { getContextClient, gql, queryStore, subscriptionStore } from '@urql/svelte';

	export let assemblyId: number;
	export let bomColumns: string[] = ['part', 'quantity'];

	$: assemblyInfoStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription assembly($assemblyId: bigint!) {
				assemblies_by_pk(id: $assemblyId) {
					name
					revision_external
					revision_internal
					meta
					bom {
						id
						name
						revision_external
						revision_internal
						created_at
						updated_at
						lines(order_by: { part: asc_nulls_last, reference: asc_nulls_last }) {
							id
							reference
							part
							created_at
							updated_at
							partByPart {
								id
								name
								description
								manufacturer
								polarised
								properties
								created_at
								footprint
								image_url
								images
								kb
								updated_at
							}
						}
					}
					assemblies_cad {
						id
						name
						data
						layers
						meta
					}
				}
			}
		`,
		variables: { assemblyId }
	});
	$: assemblyInfo = $assemblyInfoStore?.data?.assemblies_by_pk;
	let highlightedReferences: string[] = [];
	function highlightReferences(references: string[], highlight: boolean = true) {
		if (highlight) {
			highlightedReferences = highlightedReferences.concat(references);
		} else {
			highlightedReferences = highlightedReferences.filter((v) => !highlightedReferences.includes(v));
		}
		console.log('highlightedReferences', highlightedReferences);
		references.forEach((r) => {
			let group = getComponentGroups(r);
			group = group?.[0];
			if (group) {
				group?.find('.outline')?.forEach((c) => {
					//console.log('Update component colour:', c);
					c.fillEnabled(highlight);
					c.fill(highlight ? 'blue' : '');
					c.opacity(0.75);
				});
			}
		});
	}

	function handleRowClick(e: CustomEvent) {
		const detail = e.detail;
		if (detail) {
			const references = detail?.references;
			if (references) {
				const highlighted = references?.filter((v) => highlightedReferences.includes(v))?.length !== 0;
				console.log('highlighted', highlighted);
				highlightReferences(references, !highlighted);
			}
		}
	}
</script>

<div class="max-h-[1000px]">
	{#if assemblyId}
		<p>
			Assembly: {assemblyId}/{assemblyInfo?.name}
			<em>({assemblyInfo?.revision_internal}:{assemblyInfo?.revision_internal})</em>
		</p>
	{/if}

	{#if assemblyInfo}
		<div class="px-0 py-1 grid grid-cols-4">
			{#if assemblyInfo?.bom}
				<div class="col-span-2 h-10">
					<a class="cursor-pointer" target="_blank" href={window.origin + '/bom/' + assemblyInfo?.bom?.id}
						>{assemblyInfo?.bom?.id}({assemblyInfo?.bom?.name})</a
					>
					<div class="h-screen overflow-y-scroll">
						<BomTable
							visibleColumns={bomColumns}
							bom={assemblyInfo?.bom}
							on:row_click={(e) => {
								handleRowClick(e);
							}}
						/>
					</div>
				</div>
			{/if}
			{#if assemblyInfo?.assemblies_cad?.data}
				<div>
					<Viewer
						classes="border"
						data={assemblyInfo?.assemblies_cad}
						id="TOP"
						layerToShow="TOP"
						height={500}
						highlightPins={[1]}
					/>
					<Viewer
						classes="border"
						data={assemblyInfo?.assemblies_cad}
						id="BOTTOM"
						layerToShow="BOTTOM"
						height={500}
						highlightPins={[1]}
					/>
				</div>
			{/if}
		</div>
	{:else}
		<p>No info for this assembly</p>
	{/if}
</div>
