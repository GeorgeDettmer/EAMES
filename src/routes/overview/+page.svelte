<script lang="ts">
	export let data;
	import { page } from '$app/stores';
	import BoardOverview from '$lib/components/BoardOverview.svelte';

	let boardId = data?.boardId;
</script>

{boardId}
<BoardOverview {boardId} />
