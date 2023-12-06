<script lang="ts">
	import { windowTitleStore } from '$lib/stores';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import AddCustomer from '$lib/components/Add/AddCustomer.svelte';

	export let data: PageData;

	onMount(() => {
		$windowTitleStore = 'Customer new';
		return () => {
			$windowTitleStore = '';
		};
	});
</script>

<div class="p-2 bg-slate-500">
	<AddCustomer />
</div>
