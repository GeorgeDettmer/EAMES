<script lang="ts">
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

	$: stepsComplete = steps?.filter((i) => i?.signoffs?.length > 0);
	$: complete = stepsComplete?.length === steps?.length;
</script>

<div class="p-1 w-2/3">
	<div
		class="border-4 rounded-md w-full my-2"
		class:border-green-400={complete}
		class:border-red-600={!complete}
		class:bg-green-200={complete}
		class:bg-red-300={!complete}
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
				<p>{stepsComplete?.length}/{steps?.length}</p>
			</div>
		</div>
	</div>
	{#each steps as item (item.id)}
		<InstructionListItem {item} />
	{/each}
</div>
