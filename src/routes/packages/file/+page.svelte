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
		Spinner,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { datetimeFormat, replaceStateWithQuery } from '$lib/utils';
	import { onMount } from 'svelte';
	import FileDrop from 'filedrop-svelte/components/FileDrop';

	$: allPackagesQueryStore = queryStore({
		client: getContextClient(),
		query: gql`
			query allPackages($modifiedtime: timestamp_comparison_exp = {}, $name: String_comparison_exp = {}) {
				mydbpackview_14_package_base(
					limit: 10000
					order_by: { modifiedtime: desc }
					where: { modifiedtime: $modifiedtime, name: $name }
				) {
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
		variables: {
			modifiedtime:
				modifiedFilterStart && modifiedFilterEnd
					? {
							_gte: modifiedFilterStart,
							_lte: modifiedFilterEnd + 'T23:59:59'
					  }
					: {},
			name: nameSearch
				? {
						_ilike: '%' + nameSearch + '%'
				  }
				: {}
		},
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
	$: historyEntries = packageHistory?.length;
	$: allPackages = $allPackagesQueryStore?.data?.mydbpackview_14_package_base || [];
	$: allPackagesFiltered = allPackages; /* ?.filter((p) =>
		nameSearch ? p.name.toLowerCase().includes(nameSearch.toLowerCase()) : true
	); */
	$: console.log(packageHistory);

	let nameSearch = '';
	let openRowIdx = -1;
	let showHistory = false;

	let modifiedFilterStart = '';
	let modifiedFilterEnd = '';
	$: console.log('modifiedFilter', modifiedFilterStart, modifiedFilterEnd);

	onMount(() => {
		modifiedFilterStart = $page.url.searchParams.get('modifiedStart') || '';
		modifiedFilterEnd = $page.url.searchParams.get('modifiedEnd') || '';
		nameSearch = $page.url.searchParams.get('name') || '';
	});

	let files;
	let items = [];
	async function handleDropAsync(e) {
		e.stopPropagation();
		e.preventDefault();

		const f: File = e.dataTransfer.files[0];
		const d = await f.text();

		let chunks = d
			.split(/(^P00|C00)/)
			.map((c) => c.trim())
			?.filter((c) => !!c);
		//let chunks = d.split(/(?=[^P00|C00])|()?<=[^P00|C00]/g);
		//console.log(chunks);
		for (let i = 1; i < chunks.length; i += 2) {
			const chunk = chunks[i];
			const raw = chunks[i - 1] + ' ' + chunk;
			//console.log({ chunk, raw });
			let item = chunk.split(/\r?\n/)?.map((l) => l.replace(/\r?\n/, '')?.trim());
			items.push({
				name: item?.[0],
				raw: raw
			});
		}
		console.log(items?.length, items);
	}
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

<FileDrop
	on:filedrop={(e) => {
		files = e.detail.files;
		console.log('DROP', e);
		handleDropAsync(e.detail.event);
	}}
>
	<div class="flex bg-slate-500 h-20">Drag & drop BOM</div>
</FileDrop>

<div class="mt-2">
	<div>
		<Table hoverable>
			<TableHead theadClass="text-xs uppercase">
				<TableHeadCell />
				<TableHeadCell>
					<div class="flex">
						<p class="my-auto pr-4">Name</p>
						<Input
							bind:value={nameSearch}
							placeholder="Search by package name"
							size="sm"
							on:input={() => {
								replaceStateWithQuery({
									name: nameSearch
								});
							}}
						/>
					</div>
				</TableHeadCell>
				<TableHeadCell>
					<div class="flex">
						<p class="my-auto pr-4">Last modified</p>
						<input
							class="block w-28 text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded p-1"
							type="date"
							on:change={() => {
								replaceStateWithQuery({
									modifiedStart: modifiedFilterStart
								});
								if (!modifiedFilterEnd) {
									modifiedFilterEnd = modifiedFilterStart;
								}
							}}
							bind:value={modifiedFilterStart}
						/>
						<p class="my-auto px-1 text-2xl">-</p>
						<input
							class="block w-28 text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded p-1"
							type="date"
							on:change={() => {
								replaceStateWithQuery({
									modifiedEnd: modifiedFilterEnd
								});
							}}
							min={modifiedFilterStart}
							disabled={!modifiedFilterStart}
							bind:value={modifiedFilterEnd}
						/>
					</div>
				</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each items as { name, raw }, idx}
					{name}
					<TableBodyRow
						class="cursor-pointer"
						on:click={() => {
							if (openRowIdx === idx) {
								openRowIdx = -1;
								return;
							}
							/* name = pkg.name; */
							openRowIdx = idx;
						}}
					>
						<TableBodyCell tdClass="px-6 py-2 whitespace-nowrap font-medium">{idx + 1}</TableBodyCell>
						<TableBodyCell tdClass="px-6 py-2 whitespace-nowrap font-medium">{name}</TableBodyCell>
						<TableBodyCell tdClass="px-6 py-2 whitespace-nowrap font-medium" />
					</TableBodyRow>
					{#if openRowIdx === idx}
						<TableBodyRow class="h-24 shadow-inner">
							<TableBodyCell>
								<a href={'http://192.168.1.244/viewPackage.cgi?PCK=' + name} target="_blank" class="underline py-2">
									{name}
								</a>
							</TableBodyCell>
							<TableBodyCell class="p-0">
								<!-- <div class="px-1 py-1 grid grid-cols-2">
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
								</div> -->
								{JSON.stringify(raw, null, 2)}
							</TableBodyCell>
							<TableBodyCell>
								<div class="px-1 py-1 mx-auto">
									<!-- <p>Changes in history: {packageHistory.length}</p>
									<Button color="blue" disabled={!packageHistory.length} on:click={() => (showHistory = true)}>
										Show history
									</Button> -->
								</div>
							</TableBodyCell>
						</TableBodyRow>
					{/if}
				{:else}
					<TableBodyRow>
						<TableBodyCell colspan="3">
							{#if $allPackagesQueryStore.fetching}
								<p>Loading packages...</p>
							{:else if $allPackagesQueryStore.error}
								<p>Error! {$allPackagesQueryStore.error.message}</p>
							{/if}
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	</div>
</div>
