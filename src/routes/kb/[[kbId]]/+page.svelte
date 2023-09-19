<script lang="ts">
	import List from '$lib/components/KnowledgeBase/List.svelte';
	import type { PageData } from '../$types';

	export let data: PageData;
	let kbId: string = data?.kbId;

	let kbInfo = false;
</script>

{#if kbInfo}{/if}
<List {kbId} bind:kbInfo />
