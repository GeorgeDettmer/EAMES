<script lang="ts">
	import { page } from '$app/stores';
	import BoardOverview from '$lib/components/BoardOverview.svelte';

	export let data;

	let boardId = data?.boardId;
</script>

{boardId}
<BoardOverview {boardId} />
