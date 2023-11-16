<script lang="ts">
	import AddAssembly from '$lib/components/Add/AddAssembly.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="p-2 bg-slate-500">
	<AddAssembly />
</div>
