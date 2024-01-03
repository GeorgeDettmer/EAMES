<script lang="ts">
	import AddComponent from '$lib/components/Add/AddComponent.svelte';
	import NewComponent from '$lib/components/BOM/NewComponent.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="p-2 bg-slate-500">
	<AddComponent />
</div>
<NewComponent />
