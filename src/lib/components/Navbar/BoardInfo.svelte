<script lang="ts">
	import { createEventDispatcher, getContext } from 'svelte';

	import Barcode from '../Barcode.svelte';

	export let boardId: string;
	export let barcodeType: string = 'datamatrix';
	export let barcodeImageUrl: string = `http://bwipjs-api.metafloor.com/?bcid=${barcodeType}&text=${boardId}`;

	const dispatch = createEventDispatcher();

	const currentBoard = getContext('currentBoard');

	let boardVisible = false;
</script>

{#if boardId}
	<div class="ml-10 flex-auto outline-gray-500">
		<div class="flex">
			<div class="grid grid-rows-2 grid-flow-col">
				<div class="px-2 row-span-3 rounded-bl-lg rounded-tl-lg border-2 border-slate-500">
					<Barcode
						boardId={boardId || '0'}
						on:click={() => {
							boardVisible = true;
						}}
					/>
				</div>
				{#if $currentBoard?.boardInfo?.id}
					<div
						class="px-2 font-semibold col-span-2 rounded-tr-lg border-2 border-l-0 border-b-0 border-slate-500"
					>
						EAS{$currentBoard?.boardInfo?.job?.batch}
					</div>
					<div
						class="px-2 font-semibold col-span-2 rounded-br-lg border-2 border-l-0 border-slate-500"
					>
						<span class="font-normal">{$currentBoard?.boardInfo.job?.customer?.name || ''}</span>
						{$currentBoard?.boardInfo?.assembly?.name} ({$currentBoard?.boardInfo?.assembly
							?.revision_external}:{$currentBoard?.boardInfo?.assembly?.revision_internal})
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
