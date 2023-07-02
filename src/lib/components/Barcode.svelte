<script lang="ts">
	import { createEventDispatcher, getContext } from 'svelte';
	import { Button, Popover } from 'flowbite-svelte';

	import BoardPopoverContent from './BoardPopoverContent.svelte';
	import { padSerial } from '$lib/utils';

	export let boardId: string = '0';
	export let barcodeType: string = 'datamatrix';
	export let barcodeImageUrl: string = `http://bwipjs-api.metafloor.com/?bcid=${barcodeType}&text=${boardId}`;

	$: id = padSerial(boardId);

	const dispatch = createEventDispatcher();

	const currentBoard = getContext('currentBoard');
</script>

{#if boardId}
	<Button
		color="none"
		id={'board-' + boardId}
		class="!p-1 mt-0.5"
		on:click={(e) => {
			dispatch('click', {
				event: e
			});
		}}
	>
		<div>
			<div class="flex items-center justify-center {boardId == '0' && 'text-red-600'}">
				<img class="" style:filter={'invert(0.5)'} src={barcodeImageUrl} />
				<p class="pl-1 text-4xl">{id}</p>
			</div>
			{#if boardId != '0'}
				<Popover placement="bottom" triggeredBy={'#board-' + boardId} class="w-64">
					<BoardPopoverContent
						{boardId}
						complete={$currentBoard?.boardSteps?.filter((s) => s?.signoffs?.length > 0).length}
						incomplete={$currentBoard?.boardSteps?.filter((s) => s?.signoffs?.length == 0).length}
					/>
				</Popover>
			{/if}
		</div>
	</Button>
{/if}
