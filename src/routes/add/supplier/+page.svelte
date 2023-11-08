<script lang="ts">
	import AddSupplier from '$lib/components/Add/AddSupplier.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="p-2 bg-slate-500">
	<AddSupplier />
</div>
