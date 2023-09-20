<script lang="ts">
	import { Card } from 'flowbite-svelte';
	import UserIcon from '../UserIcon.svelte';
	import { onMount } from 'svelte';

	export let kbItem;
	export let kbIndex: number;

	let images = kbItem?.images || [];
	let imageIdx = 0;
	let image = images?.[imageIdx];
	let imageInterval = 2000;
	onMount(() => {
		if (!images) return;
		setInterval(() => {
			imageIdx++;
			if (imageIdx > images.length - 1) {
				imageIdx = 0;
			}
			image = images[imageIdx];
		}, imageInterval);
	});
	console.log(kbItem);
</script>

<div
	class="mb-1 hover:shadow-inner p-2 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-700 dark:border-gray-600"
>
	<!-- <div class="-inset-5"><p>{kbIndex + 1}</p></div> -->
	<div class="flex">
		{#if kbItem?.user}
			<div class="float-right">
				<UserIcon user={kbItem?.user} size="sm" />
			</div>
		{/if}
		<div class="float-left mb-3 text-sm font-normal text-gray-700 dark:text-gray-400 leading-tight">
			{@html kbItem?.content}
		</div>
		<!-- <h5 class="mb-2 text-sm font-bold tracking-tight text-gray-900 dark:text-white">
				{kbIndex + 1 ? kbIndex + 1 : kbItem?.id}
			</h5> -->
		{#if image}
			<img
				src={`../src/lib/assets/${image}`}
				class="w-28 !p-0 float-right mx-auto"
				on:click={() => {
					imageIdx++;
					imageInterval = 2000;
					if (imageIdx > images.length - 1) {
						imageIdx = 0;
					}
				}}
			/>
		{/if}
	</div>
</div>
