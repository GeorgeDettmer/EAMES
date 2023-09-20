<script lang="ts">
	import CreateForm from '$lib/components/KnowledgeBase/CreateForm.svelte';
	import List from '$lib/components/KnowledgeBase/List.svelte';
	import type { PageData } from '../$types';

	export let data: PageData;
	let kbId: string = data?.kbId;

	let kbInfo = false;
</script>

{#if kbInfo}{/if}
<div class="w-2/3 mx-auto">
	<CreateForm {kbId} />
	<div
		class="p-4 my-2 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-700 dark:border-gray-600 max-h-fit"
	>
		<List {kbId} bind:kbInfo />
	</div>
</div>
