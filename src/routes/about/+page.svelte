<script>
	export let data;

	console.log(data);
	$: ({ Boards } = data);
</script>

<h1>About this site</h1>
<p>TODO...</p>
<a href="/">Home</a>
{$Boards.data}
{#each $Boards.data.boards as board}
	{board}
{/each}
