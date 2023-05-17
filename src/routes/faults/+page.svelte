<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	import { getContextClient, gql, queryStore } from '@urql/svelte';

	const faultsQueryStore = queryStore({
		client: getContextClient(),
		query: gql`
			query Faults {
				faults(batch: "May23") {
					ID
					JobNumber
					SerialNumber
					BoardName
					Ident
					Description
					FaultDescription
					DateInspected
					Inspector
					Reworked
				}
			}
		`
	});
</script>

{#if $faultsQueryStore.fetching}
	<p>Loading...</p>
{:else if $faultsQueryStore.error}
	<p>Oopsie! {$faultsQueryStore.error.message}</p>
{:else}
	{#each $faultsQueryStore.data.faults as fault}
		<p>{fault.ID}</p>
		<pre>{JSON.stringify(fault)}</pre>
		<hr />
	{/each}
{/if}
