<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import BomTable from '$lib/components/BOM/BomTable.svelte';
	import { getParameterInsensitiveAny, toRanges } from '$lib/utils';
	import { getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import FileDrop from 'filedrop-svelte';
	import type { Files } from 'filedrop-svelte';
	import { Button, Input, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
	import { messagesStore } from 'svelte-legos';
	const urqlClient = getContextClient();
	$: assemblyId = Number($page?.data?.assemblyId);

	const _config = {
		bom: {
			headings: {
				part: ['ipn', 'pn', 'part', 'mpn'],
				description: ['description', 'desc'],
				quantity: ['quantity', 'quantities', 'qty'],
				references: ['reference', 'references', 'refdes']
			},
			template: {
				default: ['MPN', 'Description', 'RefDes', 'Qty']
			}
		}
	};

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

	let bom = {};
	async function handleDropAsync(e) {
		e.stopPropagation();
		e.preventDefault();

		const f = e.dataTransfer.files[0];
		const data = await f.arrayBuffer();
		const wb = read(data);
		const ws = getParameterInsensitiveAny(wb.Sheets, ['bom']);
		if (!ws) {
			messagesStore("The supplied workbook does not include a sheet named 'BOM'. Found: " + wb.SheetNames);
		}
		console.log(wb.Sheets, ws);
		lines = utils.sheet_to_json(ws);
		html = utils.sheet_to_html(ws);
		let range = {
			s: { c: 0, r: 0 },
			e: { c: 1000, r: 1000 }
		};
		if (ws['!autofilter']?.ref) {
			range = utils.decode_range(ws['!autofilter']?.ref);
		}
		console.log('data range:', range);
		let rowsValues = [];
		const includesAll = (arr, values) => values.every((v) => arr.includes(v));
		/* for (let R = range.s.r; R <= range.e.r; ++R) {
			let rowValues = [];
			for (let C = range.s.c; C <= range.e.c; ++C) {
				let cell_address = { c: C, r: R };
				let cell_ref = utils.encode_cell(cell_address);
				rowValues.push(ws[cell_ref]?.v);
			}
			rowsValues.push(rowValues);
			console.log('row values:', rowValues);
			if (includesAll(rowValues, ['MPN', 'Description', 'RefDes', 'Qty'])) {
				console.log('Header: ', R, rowValues);
			}
		} */
		console.log(rowsValues);
		console.log(
			'lines:',
			lines,
			Object.values(lines?.[0]),
			includesAll(Object.values(lines?.[0]), _config.bom.template.default)
		);
		console.log('headings:', Object.values(_config.bom.headings));
		let isKeyed: boolean = Object.values(_config.bom.headings)
			.map((h) => {
				return Object.keys(lines?.[0]).some((v) => h.includes(v.toLowerCase()));
			})
			.every((v) => v === true);
		console.log('keyed:', isKeyed);
		if (!isKeyed) {
			let headerIdx = lines.findIndex((v) => includesAll(Object.values(v), _config.bom.template.default));
			let newLines = lines.slice(headerIdx);
			let keys = newLines[0];
			newLines = lines.slice(headerIdx + 1);
			keys = Object.values(keys);
			lines = newLines.map((l, idx) => {
				let newLine = {};
				Object.values(l).forEach((v, i) => {
					let newKey = keys[i];
					if (Object.keys(newLine).includes(newKey)) return;
					newLine[newKey] = v;
				});
				return newLine;
			});

			console.log('keys:', keys, headerIdx);
		}
		console.log('new lines:', lines);
		lines.forEach((line, idx) => {
			let pn = getParameterInsensitiveAny(line, _config.bom.headings.part);
			let qty = getParameterInsensitiveAny(line, _config.bom.headings.quantity);
			let references = getParameterInsensitiveAny(line, _config.bom.headings.references);
			if (!pn && getParameterInsensitiveAny(lines?.[idx - 1], _config.bom.headings.part)) {
				line.ipn = getParameterInsensitiveAny(lines?.[idx - 1], _config.bom.headings.part);
			}
			if (!qty && references) {
				line.qty = references?.split(',')?.length;
			}
		});
		let _lines = [];
		lines.forEach((line) => {
			let references = getParameterInsensitiveAny(line, _config.bom.headings.references);
			let refs = references?.split(',')?.map((r) => r.trim()); //TODO: Check if null
			if (!refs || refs.length == 0) {
				console.error('BOM ADD', 'refs length 0 or null', references, refs);
			} else {
				refs.forEach((ref) => {
					let pn = getParameterInsensitiveAny(line, _config.bom.headings.part);
					let description = getParameterInsensitiveAny(line, _config.bom.headings.description);

					let l = {
						reference: ref,
						part: pn === 'Not Fitted' ? null : pn,
						description,
						partByPart: { description: description }
					};
					_lines.push(l);
				});
			}
		});
		if (_lines) {
			bom.lines = _lines;
		}
		console.log('bom.lines', bom?.lines);
		name = files.accepted[0].name?.split('.xl')?.[0] || 'Unknown name';
	}

	async function insert() {
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
			return;
		}
		if (!lines || !files?.accepted[0]?.name || !bom?.lines) {
			messagesStore('The BOM does not have properly formatted lines', 'warning');
		}
		if (!$page?.data?.user?.processes?.['eng']) {
			alert(
				`You do not have permission to insert BOMs. You have permission for: ${Object.keys(
					$page?.data?.user?.processes || {}
				)}`
			);
			return;
		}
		let mutationResult;
		let bom_lines = bom?.lines?.map((l) => {
			if (!l?.part) {
				console.log('eee', l);
			}
			return { reference: l?.reference, part: l?.part, description: l?.description };
		});
		console.log('linesz', bom_lines);
		mutationResult = await urqlClient.mutation(
			gql`
				mutation insertBOM(
					$data: [bom_lines_insert_input!] = {}
					$name: String = ""
					$revision_external: String = ""
					$revision_internal: Int = 1
				) {
					insert_bom_one(
						object: {
							lines: { data: $data }
							name: $name
							revision_external: $revision_external
							revision_internal: $revision_internal
						}
					) {
						id
					}
				}
			`,
			{ data: bom_lines, name: name, revision_external }
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore('Inserted BOM: ' + mutationResult.data.insert_bom_one.id, 'success');
			if (assemblyId && mutationResult?.data?.insert_bom_one?.id) {
				mutationResult = await urqlClient.mutation(
					gql`
						mutation updateAssembly($assemblyId: bigint!, $bomId: uuid!) {
							update_assemblies_by_pk(pk_columns: { id: $assemblyId }, _set: { bom_id: $bomId }) {
								bom_id
							}
						}
					`,
					{ assemblyId, bomId: mutationResult.data.insert_bom_one.id }
				);
				if (mutationResult?.error) {
					console.error('MUTATION ERROR: ', mutationResult);
					messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
				} else {
					console.log('MUTATION RESULT: ', mutationResult);
					messagesStore(`Set BOM for ${assemblyInfo?.name}`, 'success');
				}
			}
			goto('/bom/' + mutationResult.data.insert_bom_one.id);
		}
	}

	$: partsInfoStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription partsExist($parts: [String!] = []) {
				parts_data(where: { name: { _in: $parts } }) {
					id
					name
				}
			}
		`,
		variables: {
			parts: bom?.lines?.map((l) => {
				return l?.part ? l?.part : '';
			})
		}
	});
	$: partsInfo = $partsInfoStore?.data?.parts_data;
	$: partsInLibrary = partsInfo?.map((p) => {
		return p?.id;
	});

	$: partsNotInLibrary = (bom?.lines || [])?.map((l) => l?.part)?.filter((x) => x && !partsInLibrary?.includes(x));
	$: canAdd = partsNotInLibrary.length === 0;
	$: console.log('partsInLibrary', partsInLibrary);

	let revision_external = '';
	let name = '';
</script>

{#if assemblyId}
	<p>Assembly: {assemblyId} <em>({assemblyInfo?.name})</em></p>
	{#if assemblyInfo?.bom}
		<a class="cursor-pointer" target="_blank" href={window.origin + '/bom/' + assemblyInfo?.bom?.id}
			>BOM ID: {assemblyInfo?.bom?.id}</a
		>
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
	<p>File: {files.accepted[0].name}</p>
{/if}
<!-- <Table hoverable shadow>
	<TableHead theadClass="bg-slate-200">
		<TableHeadCell>#</TableHeadCell>
		<TableHeadCell>Qty</TableHeadCell>
		<TableHeadCell>References</TableHeadCell>
		<TableHeadCell>Description</TableHeadCell>
		<TableHeadCell>Part</TableHeadCell>
		<TableHeadCell />
	</TableHead>
	<TableBody tableBodyClass="divide-y divide-x">
		{#each lines as p, idx}
			{@const references = getParameterInsensitiveAny(p, ['reference', 'references'])}
			{@const quantity = getParameterInsensitiveAny(p, ['quantity', 'quantities', 'qty'])}
			{@const description = getParameterInsensitiveAny(p, ['description', 'descriptions', 'desc'])}
			{@const pn = getParameterInsensitiveAny(p, ['ipn', 'pn', 'part', 'parts'])}
			{@const refSplit = references?.split(',')}
			{@const refCount = refSplit?.length}
			{@const refRange = toRanges(references?.split(',')) || [references]}

			<TableBodyRow>
				<TableBodyCell>{idx + 1}</TableBodyCell>
				<TableBodyCell tdClass={quantity !== refCount ? 'text-red-600' : ''}>{quantity || ''}</TableBodyCell>

				<TableBodyCell tdClass="overflow-x-auto">
					<div class="grid">
						<div>{refRange}</div>
						<div>{`${references}  (${refCount})` || ''}</div>
					</div>
				</TableBodyCell>
				<TableBodyCell>{description || ''}</TableBodyCell>
				<TableBodyCell tdClass={pn !== 'Not Fitted' && partsInLibrary?.includes(pn) ? '' : 'underline'}
					>{pn || ''}</TableBodyCell
				>
				<TableBodyCell>
					{#if pn !== 'Not Fitted' && partsInLibrary && !partsInLibrary?.includes(pn)}
						<Button size="xs" outline color={'blue'}>➕</Button>
					{/if}
				</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table> -->
{#if bom?.lines}
	<Button outline color={canAdd ? 'green' : 'red'} on:click={insert}>Insert BOM</Button>
	<Input type="text" bind:value={name} placeholder={'Name'} />
	<Input type="text" bind:value={revision_external} placeholder={'External revision'} />

	<hr />
	<BomTable {bom} {partsInLibrary} />
{/if}
<div class="my-4">
	{#if lines?.length > 0}
		<table>
			<thead>
				<th>Qty</th>
				<th>References</th>
				<th>Description</th>
				<th>Part</th>
			</thead>
			<tbody>
				{#each lines as p}
					{@const references = getParameterInsensitiveAny(p, _config.bom.headings.references)}
					{@const quantity = getParameterInsensitiveAny(p, _config.bom.headings.quantity)}
					{@const description = getParameterInsensitiveAny(p, _config.bom.headings.description)}
					{@const pn = getParameterInsensitiveAny(p, _config.bom.headings.part)}
					{@const refSplit = references?.split(',')}
					{@const refCount = refSplit?.length}
					<tr class:bg-slate-500={p.ipn == 'Not Fitted'}>
						<td class:text-red-600={quantity !== refCount}>{refCount}:{quantity || ''}</td>
						<td>{references || ''}</td>
						<td>{description || ''}</td>
						<td class:underline={partsInLibrary?.includes(pn)}>{pn || ''}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
	<div bind:this={tbl}>{@html html}</div>
</div>
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
