<script lang="ts">
	import { Tooltip } from 'flowbite-svelte';
	import UserIcon from '../UserIcon.svelte';
	import { onMount } from 'svelte';

	export let kbItem;

	let images = kbItem?.images || [];
	let imageIdx = 0;

	onMount(() => {
		if (!images) return;
		let image = images?.[imageIdx];

		setInterval(() => {
			imageIdx++;
			if (imageIdx > images.length - 1) {
				imageIdx = 0;
			}
			image = images[imageIdx];
		}, 2000);
	});
</script>

<div class="flex font-thin text-sm">
	<div class="flex">
		<a class="cursor-pointer" target="_blank" href={window.origin + '/kb/' + kbItem?.kb_id}>📝</a>
		<p>{new Date(kbItem?.created_at).toLocaleString()}</p>
	</div>

	<Tooltip>
		{#if kbItem?.updated_at !== kbItem?.created_at}
			Edited @ {new Date(kbItem?.updated_at).toLocaleString()}
			<br />
		{/if}
		Created @ {new Date(kbItem?.created_at).toLocaleString()}
	</Tooltip>
</div>

<div class="p-1">
	<div class="mx-4 mb-4">{@html kbItem?.content}</div>

	{#if images.length > 0}
		<div class="grid md:grid-cols-3 sm:grid-cols-2">
			<!-- <img src={image ? `../src/lib/assets/${image}` : ''} /> -->
			{#each images as image}
				<a href={`../src/lib/assets/${image}`} target="_blank" class="border rounded-lg p-1 mx-1 hover:shadow-inner">
					<img src={`../src/lib/assets/${image}`} class="w-fit" alt={image} />
				</a>
			{/each}
		</div>
	{/if}

	<!-- <Thumbnails {images} bind:imageIndex /> -->
</div>
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

{#if kbItem?.comments}
	<div class="p-2 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-700 dark:border-gray-600">
		<div class="justify-between items-center mb-1 sm:flex">
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
					<div class="flex py-1">
						<div class="pr-1 cursor-help">
							<UserIcon user={comment?.user} size="sm" />
							<Tooltip>{comment?.user?.first_name} {comment?.user?.last_name}</Tooltip>
						</div>
						<div
							class="w-full p-2 text-sm font-normal text-gray-500 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300"
						>
							<div
								class="text-xs float-right text-right font-bold cursor-help"
								class:italic={comment?.updated_at !== comment?.created_at}
							>
								<p>{new Date(comment?.created_at).toLocaleString()}</p>
								<Tooltip>
									{#if comment?.updated_at !== comment?.created_at}
										Edited @ {new Date(comment?.updated_at).toLocaleString()}
										<br />
									{/if}
									Created @ {new Date(comment?.created_at).toLocaleString()}
								</Tooltip>
							</div>
							<div>{@html comment?.content}</div>
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}
