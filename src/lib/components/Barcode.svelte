<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button, Popover } from 'flowbite-svelte';

	import BoardPopoverContent from './BoardPopoverContent.svelte';

	export let boardId: string;
	export let barcodeType: string = 'datamatrix';
	export let barcodeImageUrl: string = `http://bwipjs-api.metafloor.com/?bcid=${barcodeType}&text=${boardId}`;

	const dispatch = createEventDispatcher();
</script>

{#if boardId}
	<Button
		color="light"
		id={'board-' + boardId}
		class="!p-1"
		on:click={(e) => {
			dispatch('click', {
				event: e
			});
		}}
	>
		<div>
			<div class="flex items-center justify-center">
				<img class="w-10 p-0.5" style:filter={'invert(0.5)'} src={barcodeImageUrl} alt={boardId} />
				<p class="pl-1 text-3xl">{boardId}</p>
			</div>
			<Popover placement="bottom" triggeredBy={'#board-' + boardId} class="w-64">
				<BoardPopoverContent {boardId} complete={6} incomplete={0} />
			</Popover>
		</div>
	</Button>
{/if}
