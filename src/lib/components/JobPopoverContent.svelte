<script lang="ts">
	import { classes } from '$lib/utils';
	import Progressbar from './Progressbar.svelte';

	export let job;

	let complete = 50;
	let incomplete = 50;
	$: total = complete + incomplete;
	$: progress = Math.round((100 / total) * complete);
</script>

<div class="space-y-2">
	<!-- <h3 class="font-semibold text-gray-900 dark:text-white text-3xl">
		<span>{boardId}</span>
	</h3> -->
	<p class="text-gray-500 dark:text-gray-400">
		<span class="font-semibold text-gray-900 dark:text-white">{complete}</span> of
		<span class="font-semibold text-gray-900 dark:text-white">{total}</span> boards complete
	</p>
	<div class="w-full rounded-full mb-4 bg-red-600">
		<Progressbar progress={progress.toString()} labelInside={true} color="green" />
	</div>
</div>
