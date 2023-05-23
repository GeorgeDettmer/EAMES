<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';

	export let data: PageData;

	import { getContextClient, gql, queryStore } from '@urql/svelte';
	$: name = 'Not Fitted';
	$: packageHistoryQueryStore = queryStore({
		client: getContextClient(),
		query: gql`
			query history($name: String = "Not Fitted") {
				mycronic_tpsys_packages(
					where: { name: { _eq: $name } }
					order_by: { modifiedcount: desc }
				) {
					changed_at
					id
					name
					modifiedtime
					modifiedcount
					phs_nom_lenght
					phs_min_lenght
					phs_max_lenght
					phs_nom_width
					phs_min_width
					phs_max_width
					phs_nom_height
					phs_min_height
					phs_max_height
					ztoolset
					hydratoolset
					pickwaittimeoffset
					placewaittimeoffset
					placeforce
					lowforce
					tooltotopoffset
					mountprecision
					vacuumtest
					phiacccode
					hphiacccode
					xacccode
					zacccode
					hzacccode
					yacccode
					tapeacccode
					zupspeed
					zupdist
					holduntilready
					pickoffsetfeedback
					usebestfit
					algorithm
					indextype
					indexareapos_x
					indexareapos_y
					indexareasize
					indexmincorr
					cameraset
					bannedcameraset
					hydracameraset
					presangle
					autopresangle
					pinnoofupperleft
					diagonalleads
					slowdownatpick
					slowdownatplace
					hydrafinepitchrequired
					hydrafloatingpick
					hydraextendedreject
					pickoffset_x
					pickoffset_y
				}
			}
		`,
		variables: {
			name: name
		}
	});
	//$: changesTotal = $packageHistoryQueryStore?.data?.mycronic_tpsys_packages?.length || 0;
	$: console.log($packageHistoryQueryStore.data);

	function compare(obj1, obj2) {
		let newObj = {};
		Object.keys(obj1).forEach((key) => {
			if (obj1[key] !== obj2[key]) {
				newObj[key] = [obj1[key], obj2[key]];
			}
		});
		return newObj;
	}
</script>

<input id="search" type="text" />
<input
	type="button"
	value="Search"
	on:click={() => {
		name = document.getElementById('search').value || '';
		console.log(name);
	}}
/>
History:
{#if $packageHistoryQueryStore.fetching}
	<p>Loading...</p>
{:else if $packageHistoryQueryStore.error}
	<p>Error! {$packageHistoryQueryStore.error.message}</p>
{:else}
	{$page.url.searchParams.get('name')} ({$packageHistoryQueryStore.data.mycronic_tpsys_packages
		.length})
	{#each $packageHistoryQueryStore.data.mycronic_tpsys_packages as pkg, idx}
		<p>{pkg.id}</p>
		<pre>{JSON.stringify(
				compare($packageHistoryQueryStore.data.mycronic_tpsys_packages[idx - 1], pkg)
			)}</pre>
		<hr />
	{/each}
{/if}
