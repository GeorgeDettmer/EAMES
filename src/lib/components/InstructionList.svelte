<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import InstructionListItem from './InstructionListItem.svelte';
	import InstructionListHeader from './InstructionListHeader.svelte';
	export let instruction: Record<string, any>;
	export let steps: Array<Record<string, any>> = [];
	export let activeReference: String = '';
	export let showHeader: boolean = false;

	const dispatch = createEventDispatcher();

	function handleHeaderClick(e: MouseEvent) {
		dispatch('header_click', {
			event: e,
			item: instruction
		});
	}

	$: stepsComplete = steps?.filter((i) => i?.signoffs?.length > 0);
	$: stepsCompleteCount = stepsComplete?.length;
	$: stepsCount = steps?.length;
	$: complete = stepsCompleteCount === stepsCount;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if showHeader}
	<InstructionListHeader on:header_click={handleHeaderClick} {steps} {instruction} />
{/if}
<div class="max-h-[750px] overflow-y-scroll scrollbar-hide">
	{#each steps || [] as item (item.id)}
		<InstructionListItem on:item_click on:item_mouse {item} {activeReference} />
	{/each}
</div>

<style>
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	/* For IE, Edge and Firefox */
	.scrollbar-hide {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}
</style>
