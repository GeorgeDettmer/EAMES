<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import BomTable from '$lib/components/BOM/BomTable.svelte';
	import { getParameterInsensitiveAny } from '$lib/utils';
	import { getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import FileDrop from 'filedrop-svelte';
	import type { Files } from 'filedrop-svelte';
	import { Alert, Button, Input, Modal } from 'flowbite-svelte';
	import { InfoCircleSolid, LinkedinSolid, PlusOutline } from 'flowbite-svelte-icons';
	import { messagesStore } from 'svelte-legos';
	const urqlClient = getContextClient();
	$: assemblyId = Number($page?.data?.assemblyId);

	import { read, utils } from 'xlsx';
	import * as XLSX from 'xlsx';
	async function fileDrop(e) {
		e.stopPropagation();
		e.preventDefault();
		try {
			const f = e.dataTransfer.files[0];
			const data = await f.arrayBuffer();
			let d = parseBOMXLSX(data);
			console.log('getBOM', getBOM(d));
		} catch (error) {
			console.error('fileDrop', error);
		}
	}

	type Line = Map<string, Record<string, any>[]>;
	type Lines = Line[];

	function parseBOMXLSX(data, headerRow: number = 8, includeBlankRows: boolean = false): Lines {
		const workbook = XLSX.read(data);
		console.log('workbook', workbook, XLSX);
		console.log('sheet names', workbook?.SheetNames);
		if (workbook?.SheetNames && workbook.SheetNames?.length > 1 && !workbook?.SheetNames?.includes('BOM')) {
			console.error('The supplied workbook does not include a sheet named "BOM"');
			return [];
		}
		try {
			const sheet = workbook.Sheets ? workbook.Sheets['BOM'] : workbook.Sheets[0];
			const json: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: includeBlankRows, defval: '' });
			console.log('json', json);
			let lines: Lines = [];
			let headers: string[] = json[headerRow];
			for (let lineIdx = headerRow + 1; lineIdx < json.length; lineIdx++) {
				const line = json[lineIdx];
				const lineMap: Line = new Map();

				for (let headerIdx = 0; headerIdx < headers.length; headerIdx++) {
					const header = headers[headerIdx];
					const value = line?.[headerIdx];
					const headerKey = header?.trim()?.toLowerCase() || `?${XLSX.utils.encode_col(headerIdx)}?`;
					const exisiting = lineMap.has(headerKey);

					const lineDetail = {
						cell: XLSX.utils.encode_cell({ c: headerIdx, r: lineIdx }),
						col: XLSX.utils.encode_col(headerIdx),
						row: Number(XLSX.utils.encode_row(lineIdx)),
						value
					};

					if (exisiting) {
						///console.log('exisiting', header, headerKey, lineDetail);
						lineMap.get(headerKey)?.push(lineDetail);
					} else {
						lineMap.set(headerKey, [lineDetail]);
					}
				}
				lines.push(lineMap);
				/* lines.push(
					new Map(
						json[headerRow].map((key, j) => [
							{
								name: key?.toLowerCase(),
								cell: XLSX.utils.encode_cell({ c: j, r: i }),
								col: XLSX.utils.encode_col(j),
								row: Number(XLSX.utils.encode_row(i))
							},
							line[j]
						])
					)
				); */
			}
			console.log(lines);
			console.log('headers', headers);
			return lines;
		} catch (error) {
			console.error('parseBOMXLSX: Failed to parse imported Excel BOM: ', error);
			return [];
		}
	}

	function getBOM(
		lines: Lines,
		mappings = {
			quantity: ['J'],
			part_number: ['O'],
			description: ['description'],
			references: ['refdes']
		}
	) {
		let bom = [];

		try {
			for (let lineIdx = 0; lineIdx < 1; /* lines.length; */ lineIdx++) {
				const line = lines[lineIdx];
				if (!line) continue;
				const lineHeaders = [...line.keys()];
				const bomLineMap: Map<string, any[]> = new Map();
				console.log(lineHeaders);
				for (const mapping in mappings) {
					let matchers: string[] = mappings[mapping as keyof typeof mappings];
					let matched = lineHeaders.filter(([key, val]) => {
						return matchers.some((c) => {
							console.log('cccccccc', c, key, val);
							let cType = typeof c;
							if (cType === 'string') {
								if (/^[A-Z]+$/.test(c)) {
									console.log('cccccccc', 'col');
									val?.col === c;
								}
								console.log('cccccccc', 'header');
								return key === c;
							}
							/* if (cType === 'number' && idx === c) {
							console.log(c, idx);
							return idx === c;
						} */
							return false;
						});
					});

					console.log('matched', matched);
					if (matched.length > 0) {
						let values: any[] | undefined = line
							.get(mapping)
							?.map((l) => l.value)
							?.filter((v) => !!v);
						if (values && values.length > 0) {
							bomLineMap.set(mapping, values);
							bom.push(bomLineMap);
						}
					}
				}
			}
		} catch (error) {
			console.error('parseBOMXLSX: Failed to parse imported Excel BOM: ', error);
			return [];
		}
		console.log(
			'bom',
			bom?.map((l) => Object.fromEntries([...l]))
		);
		return bom;
	}

	/* function getBOM(
		lines,
		mappings = {
			quantity: ['J'],
			part_number: ['O'],
			description: ['description'],
			references: ['refdes']
		}
	) {
		let bom = [];
		mappings = Object.entries(mappings);
		lines.forEach((line, i) => {
			let bom_line = new Map();

			line.entries().forEach(([key, value], idx) => {
				let mapping = mappings.filter(([name, criteria]) =>
					criteria.some((c) => {
						let cType = typeof c;
						if (cType === 'string') {
							if (/^[A-Z]+$/.test(c)) {
								return key.col === c;
							}
							return key.name === c;
						}
						if (cType === 'number' && idx === c) {
							console.log(c, idx);
							return idx === c;
						}
						return false;
					})
				);
				if (mapping.length) {
					let val = bom_line.get(mapping?.[0]?.[0]) || [];
					if (value) val.push(value);
					bom_line.set(mapping?.[0]?.[0], val);
				}
			});
			bom.push(bom_line);
		});
		console.log(
			'bom',
			bom?.map((l) => Object.fromEntries([...l]))
		);
		return bom;
	} */
	/****************************************************************************************************************/

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

	import PartAddWizard from '../PartAddWizard.svelte';
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
					pn = String(pn)?.trim();
					let description = getParameterInsensitiveAny(line, _config.bom.headings.description);
					console.log('pn', pn);
					let part = pn === 'Not Fitted' || !pn ? null : pn;
					description = part ? String(description) : null;
					let l = {
						reference: ref,
						part,
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

	async function insertEmptyComonents(parts: string[]) {
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
			return;
		}
		/* 		if (!$page?.data?.user?.processes?.['eng']) {
			alert(
				`You do not have permission to insert BOMs. You have permission for: ${Object.keys(
					$page?.data?.user?.processes || {}
				)}`
			);
			return;
		} */
		let mutationResult;
		mutationResult = await urqlClient.mutation(
			gql`
				mutation insertParts($data: [parts_data_insert_input!] = {}) {
					insert_parts_data(objects: $data) {
						returning {
							id
						}
						affected_rows
					}
				}
			`,
			{
				data: parts.map((p) => {
					return { id: p.trim(), name: p.trim() };
				})
			}
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore('Inserted skeleton parts: ' + mutationResult.data.insert_parts.returning, 'success');
		}
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
		if (partsNotInLibrary.length > 0) {
			skeletonPartsAddModal = true;
			return;
		}
		let mutationResult;
		let bom_lines = bom?.lines?.map((l) => {
			if (!l?.part) {
				console.log('eee', l);
			}
			return {
				reference: l?.reference,
				part: l?.part?.trim(),
				description: l?.description?.trim()
			};
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
			let bomId = mutationResult?.data?.insert_bom_one?.id;
			if (assemblyId && bomId) {
				mutationResult = await urqlClient.mutation(
					gql`
						mutation updateAssembly($assemblyId: bigint!, $bomId: uuid!) {
							update_assemblies_by_pk(pk_columns: { id: $assemblyId }, _set: { bom_id: $bomId }) {
								bom_id
							}
						}
					`,
					{ assemblyId, bomId: bomId }
				);
				if (mutationResult?.error) {
					console.error('MUTATION ERROR: ', mutationResult);
					messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
				} else {
					console.log('MUTATION RESULT: ', mutationResult);
					messagesStore(`Set BOM for ${assemblyInfo?.name}`, 'success');
				}
			}
			goto('/bom/' + bomId);
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
				return l?.part ? String(l?.part) : '';
			})
		}
	});
	$: partsInfo = $partsInfoStore?.data?.parts_data;
	$: partsInLibrary = partsInfo?.map((p) => {
		return p?.id;
	});

	$: console.log(
		'parts:',
		bom?.lines?.map((l) => {
			return l?.part ? l?.part : '';
		}),
		$partsInfoStore
	);

	$: partsNotInLibrary = (bom?.lines || [])
		?.map((l) => l?.part)
		?.filter((x) => x && !partsInLibrary?.includes(x))
		?.filter((v, i, s) => s.indexOf(v) === i);
	$: canAdd = partsNotInLibrary.length === 0;
	$: console.log('partsInLibrary', partsInLibrary, partsNotInLibrary);

	let revision_external = '';
	let name = '';

	let skeletonPartsAddModal = false;
	let partAddModal = false;

	let partAddPart = '';
</script>

<Modal outsideclose bind:open={skeletonPartsAddModal} size="md">
	<div class="my-4">
		<Alert class="!items-start" color="red">
			<span slot="icon">
				<InfoCircleSolid slot="icon" class="w-4 h-4" />
				<span class="sr-only">Info</span>
			</span>
			<p class="font-medium">
				There are {partsNotInLibrary.length} components in this BOM that are not added to the component library, are you sure
				you want to continue?
			</p>
		</Alert>
		<div class="h-48 overflow-auto">
			<ul class="ml-4 list-disc list-inside">
				{#each partsNotInLibrary as p}
					<li class="rounded p-0.5 hover:bg-gray-100 dark:hover:bg-gray-600 uppercase">{p}</li>
				{/each}
			</ul>
		</div>
		<div class="my-2 mx-auto">
			<Button
				color="red"
				on:click={() => {
					insertEmptyComonents(partsNotInLibrary);
					skeletonPartsAddModal = false;
				}}
			>
				Continue...
			</Button>
		</div>
	</div>
</Modal>

<Modal outsideclose bind:open={partAddModal} size="xl" title={`Add ${partsNotInLibrary.length} components`}>
	<div>
		<PartAddWizard
			parts={partsNotInLibrary?.map((p) => {
				return { part: p, description: bom?.lines?.filter((l) => l.part === p)?.[0]?.description };
			})}
		/>
	</div>
</Modal>

{#if assemblyId}
	<p>Assembly: {assemblyId} <em>({assemblyInfo?.name})</em></p>
	{#if assemblyInfo?.bom}
		<a class="cursor-pointer" target="_blank" href={'/bom/' + assemblyInfo?.bom?.id}>
			BOM ID: {assemblyInfo?.bom?.id}
		</a>
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
	<div class="flex">
		<div class="w-1/3">
			<Input type="text" bind:value={name} placeholder={'Name'} />
			<Input type="text" bind:value={revision_external} placeholder={'External revision'} />
			<Button outline color={canAdd ? 'green' : 'red'} on:click={insert}>Insert BOM</Button>
		</div>
		<div class="w-1/3" />
		<div class="w-1/3 ml-auto">
			{#if partsNotInLibrary.length > 0}
				<!--<Button outline color="red" on:click={() => (skeletonPartsAddModal = true)}>Insert Skeleton Parts</Button> -->
				<p>{partsNotInLibrary.length} new parts</p>
				<button on:click={() => (partAddModal = true)}>
					<PlusOutline size="sm" />
				</button>
			{/if}
		</div>
	</div>

	<hr />
	<BomTable {bom} {partsInLibrary} />
{/if}
<!-- <div class="my-4">
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
</div> -->
{#if !files}
	<FileDrop
		on:filedrop={(e) => {
			files = e.detail.files;
			console.log('DROP', e);
			//handleDropAsync(e.detail.event);
			fileDrop(e.detail.event);
		}}
	>
		<div class="flex bg-slate-500 h-20">Drag & drop BOM</div>
	</FileDrop>
{/if}
