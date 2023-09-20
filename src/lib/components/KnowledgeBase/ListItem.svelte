<script lang="ts">
	import { Card } from 'flowbite-svelte';
	import UserIcon from '../UserIcon.svelte';
	import { onMount } from 'svelte';

	export let kbItem;
	export let kbIndex: number;

	let images = kbItem?.images || [];
	let imageIdx = 0;
	let image = images?.[imageIdx];

	onMount(() => {
		if (!images) return;
		setInterval(() => {
			imageIdx++;
			if (imageIdx > images.length - 1) {
				imageIdx = 0;
			}
			image = images[imageIdx];
		}, 2000);
	});
	console.log(kbItem);
</script>

<Card img={image ? `../src/lib/assets/${image}` : ''} horizontal class="mb-1">
	<div class="-inset-5"><p>{kbIndex + 1}</p></div>
	<div class="flex">
		<!-- <h5 class="mb-2 text-sm font-bold tracking-tight text-gray-900 dark:text-white">
				{kbIndex + 1 ? kbIndex + 1 : kbItem?.id}
			</h5> -->
		<div class="float-left mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
			{@html kbItem?.content}
		</div>

		{#if kbItem?.user}
			<div class="float-right">
				<UserIcon user={kbItem?.user} size="sm" />
			</div>
		{/if}
	</div>
</Card>
