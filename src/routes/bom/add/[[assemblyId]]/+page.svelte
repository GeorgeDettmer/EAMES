<script lang="ts">
	import { page } from '$app/stores';
	import BomTable from '$lib/components/BOM/BomTable.svelte';
	import { getContextClient, gql, queryStore, subscriptionStore } from '@urql/svelte';
	import FileDrop from 'filedrop-svelte';
	import type { Files } from 'filedrop-svelte';

	$: assemblyId = Number($page?.data?.assemblyId);

	$: assemblyInfoStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription assemblyInfo($assemblyId: bigint!) {
				assemblies_by_pk(id: $assemblyId) {
					id
					name
					revision_internal
					revision_external
					bom {
						id
						name
						revision_internal
						revision_external
					}
					jobs {
						id
						batch
						quantity
						customer {
							name
						}
					}
				}
			}
		`,
		variables: { assemblyId }
	});
	$: assemblyInfo = $assemblyInfoStore?.data?.assemblies_by_pk;

	import { read, utils, writeFileXLSX } from 'xlsx';
	let files: Files;
	let lines = [];
	let html = '';
	let tbl;
	function exportFile() {
		const ws = utils.json_to_sheet(lines);
		const wb = utils.book_new();
		utils.book_append_sheet(wb, ws, 'Data');
		writeFileXLSX(wb, 'SheetJSSvelteAoO.xlsx');
	}
	let bom = {};
	async function handleDropAsync(e) {
		e.stopPropagation();
		e.preventDefault();

		const f = e.dataTransfer.files[0];
		const data = await f.arrayBuffer();
		const wb = read(data); // parse the array buffer
		const ws = wb.Sheets?.['BOM']; // get the first worksheet
		console.log(wb.Sheets);
		lines = utils.sheet_to_json(ws);
		html = utils.sheet_to_html(ws);
		if (ws['!autofilter']?.ref) {
			let dataRange = utils.decode_range(ws['!autofilter']?.ref);
			console.log('data range:', dataRange);
		}
		lines.forEach((line, idx) => {
			if (!line.ipn && lines?.[idx - 1]?.ipn) {
				line.ipn = lines[idx - 1].ipn;
			}
		});

		let _lines = [];
		lines.forEach((line) => {
			let refs = line?.reference?.split(',');
			console.log('refs', refs);
			refs.forEach((ref) => {
				console.log('ref', ref, line.ipn);
				_lines.push({ reference: ref, part: line.ipn === 'Not Fitted' ? null : line.ipn });
			});
		});
		if (_lines) {
			bom.lines = _lines;
		}
		/* DO SOMETHING WITH workbook HERE */
	}
</script>

{#if assemblyId}
	<p>Assembly: {assemblyId} <em>({assemblyInfo?.name})</em></p>
	{#if assemblyInfo?.bom}
		BOM ID: {assemblyInfo?.bom?.id}
	{/if}
	{#if assemblyInfo?.jobs?.length > 0}
		<p>
			Used in: {assemblyInfo?.jobs?.length} job(s):
			{#each assemblyInfo?.jobs as job}
				<em>{job?.id}/{job?.batch} ({job?.customer?.name})</em>
			{/each}
		</p>
	{/if}
{/if}
{#if files?.accepted}
	File: {files.accepted[0].name}
{/if}

{#if bom?.lines}
	<BomTable {bom} />
{/if}

{#if lines?.length > 0}
	<table>
		<thead>
			<th>Qty</th>
			<th>References</th>
			<th>Description</th>
			<th>IPN</th>
		</thead>
		<tbody>
			{#each lines as p}
				<tr class:text-red-600={p.ipn == 'Not Fitted'}>
					<td>{p.Qty || ''}</td>
					<td>{p.reference || ''}</td>
					<td>{p.Description || ''}</td>
					<td>{p.ipn || ''}</td>
				</tr>
			{/each}
		</tbody>
		<!-- <tfoot>
		<td colSpan={2}>
			<button on:click={exportFile}>Export XLSX</button>
		</td>
	</tfoot> -->
	</table>
{/if}

<div bind:this={tbl}>{@html html}</div>

{#if !files}
	<FileDrop
		on:filedrop={(e) => {
			files = e.detail.files;
			console.log('DROP', e);
			handleDropAsync(e.detail.event);
		}}
	>
		<div class="flex bg-slate-500 h-20">Drag & drop BOM</div>
	</FileDrop>
{/if}

<!-- {#if files}
	<h3>Accepted files</h3>
	<ul>
		{#each files.accepted as file}
			<li>{file.name} - {file.size}</li>
		{/each}
	</ul>
	<h3>Rejected files</h3>
	<ul>
		{#each files.rejected as rejected}
			<li>{rejected.file.name} - {rejected.error.message}</li>
		{/each}
	</ul>
{/if} -->
