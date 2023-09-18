<script lang="ts">
	import { createEventDispatcher, getContext } from 'svelte';
	import { Button, Popover } from 'flowbite-svelte';

	import BoardPopoverContent from './BoardPopoverContent.svelte';
	import { padSerial } from '$lib/utils';

	export let boardId: string = '0';
	export let barcodeType: string = 'datamatrix';
	export let barcodeImageUrl: string = `http://bwipjs-api.metafloor.com/?bcid=${barcodeType}&text=${
		'http://192.168.1.73:5173/board/' + boardId
	}`;

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
				<img class="hidden md:block max-h-10" style:filter={'invert(0.5)'} src={barcodeImageUrl} />
				<p class="pl-1 md:text-4xl text-xl my-auto">{id}</p>
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
