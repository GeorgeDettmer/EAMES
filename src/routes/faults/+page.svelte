<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';

	export let data: PageData;

	import { getContextClient, gql, queryStore } from '@urql/svelte';

	const faultsQueryStore = queryStore({
		client: getContextClient(),
		query: gql`
			query Faults($batch: String) {
				faults(batch: $batch) {
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
		`,
		variables: {
			batch: $page.url.searchParams.get('batch') || 'May23'
		}
	});
	//$: faultTotal = $faultsQueryStore.data.faults.length;
	let faultSummary = new Map();
	$: {
		$faultsQueryStore?.data?.faults.forEach((fault) => {
			const current = faultSummary.get(fault.FaultDescription) || 0;
			faultSummary.set(fault.FaultDescription, current + 1);
		});
		console.log([...faultSummary]);
	}
</script>

Faults:
{#if $faultsQueryStore.fetching}
	<p>Loading...</p>
{:else if $faultsQueryStore.error}
	<p>Oopsie! {$faultsQueryStore.error.message}</p>
{:else}
	<h1>{$faultsQueryStore.data.faults.length}</h1>
	{#each [...faultSummary].sort((a, b) => b[1] - a[1]) as [type, count]}
		<p>{type}: {count}</p>
	{/each}
	<hr />
	<hr />
	{#each $faultsQueryStore.data.faults as fault}
		<p>{fault.ID}</p>
		<pre>{JSON.stringify(fault)}</pre>
		<hr />
	{/each}
{/if}
