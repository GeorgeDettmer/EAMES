<script lang="ts">
	import AddJob from '$lib/components/Add/AddJob.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="p-2 bg-slate-500">
	<AddJob />
</div>
