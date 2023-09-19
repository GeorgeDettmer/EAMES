<script lang="ts">
	import { queryStore, getContextClient, gql } from '@urql/svelte';
	import { Modal, Carousel, Activity, ActivityItem } from 'flowbite-svelte';
	import type { SizeType } from 'flowbite-svelte/dist/types';

	export let visible: boolean = false;
	export let size: SizeType = 'lg';

	export let kbItem;

	let images = kbItem?.images || [];
	let hasImages = images.length > 0;
	console.log(images, hasImages);
	if (hasImages) {
		images = images.map((url) => {
			return { src: url };
		});
	}
	let imageIndex = 0;

	let comments = kbItem?.comments?.map((c) => {
		return {
			title: c?.id,
			date: c?.created_at,
			text: c?.content,
			alt: 'image alt here',
			src: '/images/profile-picture-2.webp'
		};
	});
	console.log(comments);
</script>

<Modal id="kbmodal" bind:open={visible} {size} autoclose={true} outsideclose={true}>
	{kbItem?.kb_id}
	<!-- <form class="flex flex-col space-y-6">
		<h3 class="text-xl font-medium text-gray-900 dark:text-white p-0">Settings</h3>
		<Toggle
			on:click={toggleTheme}
			checked={window.document.documentElement.classList.contains('dark')}>Dark mode</Toggle
		>
		<Toggle
			on:click={() => {
				showDebug_page = !showDebug_page;
			}}
			checked={showDebug_page}>Show Debug: $page</Toggle
		> 
	</form>-->
	<div class="max-w-4xl space-y-4">
		{#if hasImages}
			<Carousel {images} let:Indicators let:Controls bind:imageIndex>
				<Controls />
				<Indicators />
			</Carousel>
		{/if}

		<!-- <Thumbnails {images} bind:imageIndex /> -->
	</div>
	{#if comments}
		<Activity>
			<ActivityItem activities={comments} />
		</Activity>
	{/if}
</Modal>
