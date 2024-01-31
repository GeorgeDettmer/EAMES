<script lang="ts">
	import { Badge } from 'flowbite-svelte';

	export let tags: Array<string | Record<string, any>> = [];
</script>

{#if tags?.length > 0}
	{#each tags as tag}
		{#if typeof tag === 'object'}
			{#if tag}
				<div>
					<Badge color={tag?.color}>{tag?.tag?.toUpperCase()}</Badge>
				</div>
			{/if}
		{:else}
			<div>
				<Badge color="dark">{String(tag)?.toUpperCase()}</Badge>
			</div>
		{/if}
	{/each}
{/if}
