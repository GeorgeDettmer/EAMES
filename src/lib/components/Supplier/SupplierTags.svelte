<script lang="ts">
	import { Badge } from 'flowbite-svelte';

	export let tags: Array<string | Record<string, any>> = [];
</script>

{#if tags?.length > 0}
	{#each tags as tag}
		{#if typeof tag === 'object'}
			{#if tag}
				<Badge color={tag?.color}>{tag?.tag?.toUpperCase()}</Badge>
			{/if}
		{:else}
			<Badge color="dark">{String(tag)?.toUpperCase()}</Badge>
		{/if}
	{/each}
{/if}
