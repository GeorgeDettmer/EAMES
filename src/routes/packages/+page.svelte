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
					where: { name: { _ilike: $name } }
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
	$: console.log($packageHistoryQueryStore.data);

	function compare(obj1, obj2) {
		//console.log('COMPARE:', Object.keys(obj1), Object.keys(obj2));
		if (!obj1 || !obj2) return {};
		let newObj = {};
		Object.keys(obj1).forEach((key) => {
			if (key == 'changed_at') return;
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
<h1><a href={'http://192.168.1.244/viewPackage.cgi?PCK=' + name} target="_blank">{name}</a></h1>
<h3>History: ({$packageHistoryQueryStore?.data?.mycronic_tpsys_packages?.length})</h3>
{#if $packageHistoryQueryStore.fetching}
	<p>Loading...</p>
{:else if $packageHistoryQueryStore.error}
	<p>Error! {$packageHistoryQueryStore.error.message}</p>
{:else}
	{#each $packageHistoryQueryStore?.data?.mycronic_tpsys_packages as pkg, idx}
		{@const comparison = compare(
			$packageHistoryQueryStore?.data?.mycronic_tpsys_packages[idx + 1] || pkg,
			pkg
		)}
		{@const comparisonKeys = Object.keys(comparison)}
		{#if !comparisonKeys.length}
			<table>
				<tr>
					{#each Object.keys(pkg) as key}
						<th>{key}</th>
					{/each}
				</tr>
				<tr>
					{#each Object.keys(pkg) as p}
						<td><center><span style="color: blue">{pkg[p]}</span></center></td>
					{/each}
				</tr>
			</table>
		{/if}
		<table>
			<tr>
				{#each comparisonKeys as key}
					<th>{key}</th>
				{/each}
			</tr>
			<tr>
				{#each comparisonKeys as key}
					<td
						><center
							><span style="color: orange">{comparison[key][0]}</span><br />⏬<br /><span
								style="color: green">{comparison[key][1]}</span
							></center
						></td
					>
				{/each}
			</tr>
		</table>
		<!-- <pre>{JSON.stringify(pkg)}</pre> -->
		<hr />
	{/each}
{/if}

<style>
	table {
		font-family: arial, sans-serif;
		border-collapse: collapse;
		width: 100%;
	}

	td,
	th {
		border: 1px solid #dddddd;
		text-align: left;
		padding: 8px;
	}
</style>
