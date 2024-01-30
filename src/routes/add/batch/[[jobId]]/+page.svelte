<script lang="ts">
	import AddBatch from '$lib/components/Add/AddBatch.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	const { jobId } = data;
</script>

<div class="p-2 bg-slate-500">
	<AddBatch {jobId} />
</div>
