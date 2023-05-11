<script lang="”ts”">
	import { graphql } from '$houdini';

	const assemblies = graphql(`
		query Assemblies @load {
			assemblies {
				id
				name
			}
		}
	`);
</script>

{#each $assemblies.data.assemlbies as item}
	<div>{item.name}</div>
{/each}
