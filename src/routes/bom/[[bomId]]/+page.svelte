<script lang="ts">
	export let data;
	import { page } from '$app/stores';
	import BomTable from '$lib/components/BOM/BomTable.svelte';

	$: bomId = $page?.data?.bomId;
</script>

<BomTable {bomId} />
