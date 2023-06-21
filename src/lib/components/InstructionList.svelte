<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import InstructionListItem from './InstructionListItem.svelte';
	import { XCircle, CheckCircle } from 'svelte-heros-v2';

	export let instruction = {
		name: 'THT',
		revision: 1,
		active: true,
		description: 'Through hole component assembly'
	};
	export let steps = [
		{
			id: 'item1',
			reference: '###',
			part_id: '###',
			notes: '',
			signoffs: []
		}
	];

	const dispatch = createEventDispatcher();

	function handleHeaderClick(e) {
		dispatch('header_click', {
			event: e,
			item: instruction
		});
	}

	function handleItemClick(e: MouseEvent) {
		console.log('LIST ITEM CLICK', e.detail?.item, e);
	}

	$: stepsComplete = steps?.filter((i) => i?.signoffs?.length > 0);
	$: stepsCompleteCount = stepsComplete?.length;
	$: stepsCount = steps?.length;
	$: complete = stepsCompleteCount === stepsCount;
</script>

<div
	class="border-4 rounded-md w-full"
	class:border-green-400={complete}
	class:border-red-600={!complete}
	class:bg-green-200={complete}
	class:bg-red-300={!complete}
	on:click={(e) => handleHeaderClick(e)}
>
	<div class="flex flex-row mx-1 my-2 steps-center text-3xl">
		<div class="flex-none pr-2">
			{#if complete}
				<CheckCircle size="40" class="text-green-400" />
			{:else}
				<XCircle size="40" class="text-red-600" />
			{/if}
		</div>
		<div class="flex-auto w-64">
			<p class="font-semibold">{instruction?.name}</p>
		</div>
		<div
			class="flex-none pr-2 font-semibold"
			class:text-green-400={complete}
			class:text-red-600={!complete}
		>
			{#if stepsComplete && steps}
				<p>{stepsComplete?.length}/{steps?.length}</p>
			{/if}
		</div>
	</div>
</div>
{#each steps || [] as item (item.id)}
	<InstructionListItem on:item_click {item} />
{/each}
