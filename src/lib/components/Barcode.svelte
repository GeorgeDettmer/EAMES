<script lang="ts">
	import { createEventDispatcher, getContext } from 'svelte';
	import { Button, Popover } from 'flowbite-svelte';

	import BoardPopoverContent from './BoardPopoverContent.svelte';

	export let boardId: string;
	export let barcodeType: string = 'datamatrix';
	export let barcodeImageUrl: string = `http://bwipjs-api.metafloor.com/?bcid=${barcodeType}&text=${boardId}`;

	const dispatch = createEventDispatcher();

	const currentBoard = getContext('currentBoard');
</script>

{#if boardId}
	<Button
		color=""
		id={'board-' + boardId}
		class="!p-1 mt-0.5"
		on:click={(e) => {
			dispatch('click', {
				event: e
			});
		}}
	>
		<div>
			<div class="flex items-center justify-center">
				<img class="" style:filter={'invert(0.5)'} src={barcodeImageUrl} alt={boardId} />
				<p class="pl-1 text-4xl">{boardId.padStart(10 - boardId.length, '0')}</p>
			</div>
			<Popover placement="bottom" triggeredBy={'#board-' + boardId} class="w-64">
				<BoardPopoverContent
					{boardId}
					complete={$currentBoard?.boardSteps?.filter((s) => s?.signoffs?.length > 0).length}
					incomplete={$currentBoard?.boardSteps?.filter((s) => s?.signoffs?.length == 0).length}
				/>
			</Popover>
		</div>
	</Button>
{/if}
