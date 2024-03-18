<script lang="ts">
	import NewComponent from '$lib/components/BOM/NewComponent.svelte';
	import { ArrowLeftOutline, ArrowRightOutline } from 'flowbite-svelte-icons';
	import { Progressbar } from 'flowbite-svelte';
	import { sineOut } from 'svelte/easing';
	import PartAdd from './PartAdd.svelte';

	interface Part {
		part: string;
		description: string;
	}
	export let parts: Part[] = [];

	let initialPartsCount = parts.length;
	let addedParts: string[] = [];
	$: remainingParts = parts.filter((p) => !addedParts.includes(p.part));
	$: remainingPartsCount = remainingParts.length;

	let partAddPart: Part = parts?.[0] || { part: '', description: '' };

	function addPart() {
		if (partAddPart.part) {
			addedParts.push(partAddPart.part);
		}
	}

	function previousPart() {
		let idx = remainingParts.findIndex((p) => p.part === partAddPart.part);
		if (idx < 1) {
			partAddPart = remainingParts[idx - 1];
		}
	}

	function nextPart() {
		let idx = remainingParts.findIndex((p) => p.part === partAddPart.part);
		if (idx < remainingParts.length - 1) {
			partAddPart = remainingParts[idx + 1];
		}
	}

	$: console.log('partAddPart', partAddPart);
</script>

<div class="flex h-80">
	<div class="w-1/4 px-1">
		<div class="flex pb-2 gap-x-2">
			<div class="">
				<ArrowLeftOutline size="sm" on:click={nextPart} />
			</div>
			<Progressbar
				progress={String((100 / initialPartsCount) * (initialPartsCount - remainingPartsCount))}
				animate
				tweenDuration={1500}
				easing={sineOut}
				size="h-1.5"
			/>
			<div class="">
				<ArrowRightOutline size="sm" on:click={previousPart} />
			</div>
		</div>
		<select
			class="w-full h-full block text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded py-0.5 px-0"
			size="15"
			bind:value={partAddPart}
		>
			{#each remainingParts as part}
				<option value={part}>
					{part.part}
				</option>
			{:else}
				<option value={''}> No parts to add... </option>
			{/each}
		</select>
	</div>
	<div class="w-3/4 max-h-80 overflow-y-auto p-0.5">
		{#if partAddPart?.part}
			<PartAdd id={partAddPart.part} description={partAddPart?.description || ''} lockName={true} />
		{/if}
	</div>
</div>
