<script lang="ts">
	/* 	import { graphql } from '$houdini';
	import type { PageData } from './$houdini';
	const assemblies: PageData = graphql(`
		query Assemblies @load {
			assemblies {
				id
				name
			}
		}
	`); */

	/* import type { PageData } from './$houdini';
	export let data: PageData;

	console.log(data);
	let { Assemblies } = data;
	$: ({ Assemblies } = data); */

	import { graphql } from '$houdini';
	const Assemblies = graphql(`
		subscription Assemblies {
			assemblies {
				id
				name
			}
		}
	`);
	$: Assemblies.listen();
</script>

<a href="/">Home</a>
{#if !$Assemblies.fetching}
	{#each $Assemblies.data.assemblies as item}
		<div>{item.name}</div>
	{:else}
		"Loading"
	{/each}
{:else}
	Fetching...
{/if}
