<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { CheckCircle, XCircle } from 'svelte-heros-v2';
	export let instruction: Record<string, any>;
	export let steps: Array<Record<string, any>> = [];
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

<div
	class="border-4 rounded-md w-full bg-opacity-50"
	class:border-green-400={complete}
	class:border-red-600={!complete}
	class:bg-green-400={complete}
	class:bg-red-600={!complete}
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
		<div class="flex-none pr-2 font-semibold">
			{#if stepsComplete && steps}
				<p>{stepsComplete?.length}/{steps?.length}</p>
			{/if}
		</div>
	</div>
</div>
