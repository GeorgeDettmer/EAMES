<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';

	export let data: PageData;

	import { getContextClient, gql, queryStore } from '@urql/svelte';
	import {
		Button,
		Hr,
		Input,
		Modal,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { datetimeFormat } from '$lib/utils';

	$: allPackagesQueryStore = queryStore({
		client: getContextClient(),
		query: gql`
			query allPackages {
				mydbpackview_14_package_base(limit: 10000, order_by: { modifiedtime: desc }) {
					name
					modifiedtime
					phs_min_lenght
					phs_nom_lenght
					phs_max_lenght
					phs_min_width
					phs_nom_width
					phs_max_width
					phs_min_height
					phs_nom_height
					phs_max_height
					ztoolset
					hydratoolset
					algorithm
					cameraset
					pinnoofupperleft
				}
			}
		`,
		requestPolicy: 'cache-and-network'
	});
	$: name = '';
	$: packageHistoryQueryStore = queryStore({
		client: getContextClient(),
		query: gql`
			query history($name: String = "Not Fitted") {
				mycronic_tpsys_packages(where: { name: { _ilike: $name } }, order_by: { modifiedcount: desc }) {
					changed_at
					history_id
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
	$: packageHistory = $packageHistoryQueryStore?.data?.mycronic_tpsys_packages || [];
	$: historyEntries = packageHistory.length;
	$: allPackages = $allPackagesQueryStore?.data?.mydbpackview_14_package_base || [];
	$: allPackagesFiltered = allPackages?.filter((p) =>
		nameSearch ? p.name.toLowerCase().includes(nameSearch.toLowerCase()) : true
	);
	$: console.log(packageHistory);

	let nameSearch = '';
	let openRowIdx = -1;
	let showHistory = false;
</script>

<Modal autoclose outsideclose size="lg" bind:open={showHistory}>
	<div class="grid grid-cols-1">
		{#if $packageHistoryQueryStore.fetching}
			<p>Loading package history...</p>
		{:else if $packageHistoryQueryStore.error}
			<p>Error! {$packageHistoryQueryStore.error.message}</p>
		{:else}
			<div>
				<div class="sticky top-0 bg-slate-400 rounded-sm mx-auto z-50 my-2">
					<p class="text-center font-medium text-gray-900 bg-white dark:bg-gray-900 dark:text-white">
						{allPackages?.[openRowIdx]?.name}
					</p>
				</div>
				<div class="overflow-y-auto">
					{#each packageHistory as history, idx}
						{@const previous = packageHistory?.[idx + 1]}

						{#if !previous}
							<Hr class="my-6">CREATED</Hr>
						{/if}
						<Hr>{datetimeFormat(history.modifiedtime)} ({history.history_id}:{historyEntries - idx - 1})</Hr>
						<div class="grid">
							{#each Object.keys(history) as historyKey}
								{#if !['name', 'history_id', 'modifiedcount', '__typename', 'changed_at', 'modifiedtime'].includes(historyKey)}
									<p
										class={previous === undefined
											? 'bg-green-500 text-black'
											: previous?.[historyKey] !== history?.[historyKey]
											? 'bg-red-600 text-black'
											: ''}
									>
										{historyKey}: {previous !== undefined && previous?.[historyKey] !== history?.[historyKey]
											? previous?.[historyKey] + ' ⏩ '
											: ''}{history[historyKey]}
									</p>
								{/if}
							{/each}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</Modal>

{#if $allPackagesQueryStore.fetching}
	<p>Loading packages...</p>
{:else if $allPackagesQueryStore.error}
	<p>Error! {$allPackagesQueryStore.error.message}</p>
{:else}
	<div class="mt-2">
		<div>
			<Table hoverable>
				<TableHead theadClass="text-xs uppercase">
					<TableHeadCell>{allPackagesFiltered.length}</TableHeadCell>
					<TableHeadCell>
						<div class="flex">
							<p class="my-auto pr-4">Name</p>
							<Input bind:value={nameSearch} placeholder="Search by package name" size="sm" />
						</div>
					</TableHeadCell>
					<TableHeadCell>Last modified</TableHeadCell>
				</TableHead>
				<TableBody>
					{#each allPackagesFiltered as pkg, idx}
						<TableBodyRow
							class="cursor-pointer"
							on:click={() => {
								if (openRowIdx === idx) {
									openRowIdx = -1;
									return;
								}
								name = pkg.name;
								openRowIdx = idx;
							}}
						>
							<TableBodyCell tdClass="px-6 py-2 whitespace-nowrap font-medium">{idx + 1}</TableBodyCell>
							<TableBodyCell tdClass="px-6 py-2 whitespace-nowrap font-medium">{pkg.name}</TableBodyCell>
							<TableBodyCell tdClass="px-6 py-2 whitespace-nowrap font-medium"
								>{datetimeFormat(pkg.modifiedtime)}</TableBodyCell
							>
						</TableBodyRow>
						{#if openRowIdx === idx}
							<TableBodyRow class="h-24 shadow-inner">
								<TableBodyCell>
									<a href={'http://192.168.1.244/viewPackage.cgi?PCK=' + pkg?.name} target="_blank" class="underline py-2">
										{pkg?.name}
									</a>
								</TableBodyCell>
								<TableBodyCell class="p-0">
									<div class="px-1 py-1 grid grid-cols-2">
										<div>
											<p>Length(mm): {pkg.phs_nom_lenght / 1000}({pkg.phs_min_lenght / 1000}/{pkg.phs_max_lenght / 1000})</p>
											<p>Width(mm): {pkg.phs_nom_width / 1000}({pkg.phs_min_width / 1000}/{pkg.phs_max_height / 1000})</p>
											<p>Height(mm): {pkg.phs_nom_height / 1000}({pkg.phs_min_height / 1000}/{pkg.phs_max_height / 1000})</p>
										</div>
										<div>
											<p>Centering type: {pkg.algorithm}</p>
											<p>Tools: {pkg.ztoolset}/{pkg.hydratoolset}</p>
											<p>Cameras: {pkg.cameraset}</p>
										</div>
									</div>
								</TableBodyCell>
								<TableBodyCell>
									<div class="px-1 py-1 mx-auto">
										<p>Changes in history: {packageHistory.length}</p>
										<Button color="blue" disabled={!packageHistory.length} on:click={() => (showHistory = true)}>
											Show history
										</Button>
									</div>
								</TableBodyCell>
							</TableBodyRow>
						{/if}
					{/each}
				</TableBody>
			</Table>
		</div>
	</div>

	<!-- {#each $packageHistoryQueryStore?.data?.mycronic_tpsys_packages as pkg, idx}
		{@const comparison = compare($packageHistoryQueryStore?.data?.mycronic_tpsys_packages[idx + 1] || pkg, pkg)}
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
							><span style="color: orange">{comparison[key][0]}</span><br />⏬<br /><span style="color: green"
								>{comparison[key][1]}</span
							></center
						></td
					>
				{/each}
			</tr>
		</table>
		<hr />
	{/each} -->
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
