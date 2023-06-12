<script lang="ts">
	export let id = 'c4d432d4-294b-4e8e-8aa2-a6a09f46f8fb';
	import { Select, Label } from 'flowbite-svelte';
	import { gql, getContextClient, subscriptionStore } from '@urql/svelte';

	const instructionSub = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription Instructions($id: ID!) {
				instructions(where: { id: { _eq: $id } }) {
					id
					name
					revision
					description
				}
			}
		`,
		variables: { id: id }
	});
</script>

{#if !$instructionSub.data}
	<p>No instructions</p>
{:else}
	<ul>
		{#each $instructionSub.data.instructions as instruction}
			<li style="color:{'red'}">{instruction.id}: "{instruction.name}"</li>
		{/each}
	</ul>
{/if}
