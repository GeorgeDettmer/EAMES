<script lang="ts">
	import NewComponent from '$lib/components/BOM/NewComponent.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="p-2 bg-slate-500">
	<NewComponent />
</div>
