<script lang="ts">
	import { queryStore, getContextClient, gql } from '@urql/svelte';
	import { Modal, Carousel, Activity, ActivityItem } from 'flowbite-svelte';
	import type { SizeType } from 'flowbite-svelte/dist/types';
	import { onMount } from 'svelte';
	import UserIcon from '../UserIcon.svelte';

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
</script>

<Modal id="kbmodal" bind:open={visible} {size} autoclose={true} outsideclose={true}>
	<p>{kbItem?.kb_id}</p>
	<div>{@html kbItem?.content}</div>
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
			<!-- <Carousel {images} let:Indicators let:Controls bind:imageIndex>
				<Controls />
				<Indicators />
			</Carousel> -->
		{/if}

		<!-- <Thumbnails {images} bind:imageIndex /> -->
	</div>
	{#if kbItem?.comments}
		<div
			class="p-2 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-700 dark:border-gray-600"
		>
			<div class="justify-between items-center mb-3 sm:flex">
				<p class=" text-xs font-normal text-gray-400 sm:order-last sm:mb-0">
					{kbItem?.comments?.length} comment{kbItem?.comments?.length === 1 ? '' : 's'}
				</p>
				<div class="text-sm font-normal text-gray-500 lex dark:text-gray-300" />
			</div>
			{#each kbItem?.comments as comment}
				<div class="">
					<!-- <span
					class="flex absolute -left-3 justify-center items-center w-6 h-6 bg-blue-200 rounded-full ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900"
				>
					<img class="rounded-full shadow-lg" {src} {alt} />
				</span> -->

					{#if comment?.content}
						<div class="flex">
							<div><UserIcon user={comment?.user} size="sm" /></div>
							<div
								class="w-full p-2 text-sm italic font-normal text-gray-500 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300"
							>
								<div class="text-xs font-thin float-right">
									{new Date(comment?.created_at).toLocaleString()}
								</div>
								<div>{@html comment?.content}</div>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</Modal>
