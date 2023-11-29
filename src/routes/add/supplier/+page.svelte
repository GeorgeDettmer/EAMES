<script lang="ts">
	import AddSupplier from '$lib/components/Add/AddSupplier.svelte';
	import { windowTitleStore } from '$lib/stores';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	onMount(() => {
		$windowTitleStore = 'Supplier new';
		return () => {
			$windowTitleStore = '';
		};
	});
</script>

<div class="p-2 bg-slate-500">
	<AddSupplier />
</div>
