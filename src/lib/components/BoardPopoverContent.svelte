<script lang="ts">
	import { classes } from '$lib/utils';
	import Progressbar from './Progressbar.svelte';

	export let boardId: string;
	export let complete: number = 0;
	export let incomplete: number = 0;

	$: total = complete + incomplete;
	$: progress = Math.round((100 / total) * complete);
</script>

<div class="space-y-2">
	<!-- <h3 class="font-semibold text-gray-900 dark:text-white text-3xl">
		<span>{boardId.padStart(10 - boardId.length, '0')}</span>
	</h3> -->
	<p class="text-gray-500 dark:text-gray-400">
		<span class="font-semibold text-gray-900 dark:text-white">{complete}</span> of
		<span class="font-semibold text-gray-900 dark:text-white">{total}</span> process steps complete
	</p>
	<div class="w-full rounded-full mb-4 bg-red-600">
		<Progressbar progress={progress.toString()} labelInside={true} color="green" />
	</div>
</div>
