<script lang="ts">
	import { Tooltip } from 'flowbite-svelte';
	import UserIcon from '../UserIcon.svelte';

	export let comments;
</script>

<div class="justify-between items-center mb-1 sm:flex">
	<p class=" text-xs font-normal text-gray-400 sm:order-last sm:mb-0">
		{comments?.length} comment{comments?.length === 1 ? '' : 's'}
	</p>
	<div class="text-sm font-normal text-gray-500 lex dark:text-gray-300" />
</div>
{#each comments as comment}
	<div class="">
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
