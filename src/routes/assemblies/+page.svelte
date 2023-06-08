<script lang="ts">
	import type { PageData } from '../assemblies/$types';
	export let data: PageData;

	import { gql, getContextClient, subscriptionStore } from '@urql/svelte';

	const assembliesSub = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription Assemblies {
				assemblies {
					id
					name
					revision_external
					revision_internal
				}
			}
		`
	});
</script>

{#if !$assembliesSub.data}
	<p>No new messages</p>
{:else}
	<ul>
		{#each $assembliesSub.data.assemblies as assembly}
			<li style="color:{'red'}">{assembly.id}: "{assembly.name}"</li>
		{/each}
	</ul>
{/if}
