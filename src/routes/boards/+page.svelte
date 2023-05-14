<script lang="ts">
	import type { PageData } from './$houdini';
	export let data: PageData;

	console.log(data);
	let { Boards } = data;
	$: ({ Boards } = data);
</script>

<h1>About this site</h1>
<p>TODO...</p>
<a href="/">Home</a>
{#if !$Boards.fetching}
	{#each $Boards.data.boards as board}
		<br />{board.id}
		{board.job?.assembly.name}
		{board.job?.assembly.revision_external}
		{board.job?.customer.name}
	{:else}
		No Boards
	{/each}
{:else}
	Fetching...
{/if}
