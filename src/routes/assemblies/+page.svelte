<script lang="ts">
	import type { PageData } from '../assemblies/$types';
	export let data: PageData;
	import { Select, Label } from 'flowbite-svelte';
	import { gql, getContextClient, subscriptionStore } from '@urql/svelte';

	import Instruction from '$lib/components/Instruction.svelte';

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

	let selected = '';
	let assemblies = [];
	$: {
		assemblies = [];
		$assembliesSub?.data?.assemblies?.forEach((a) =>
			assemblies.push({ value: a.id, name: a.name })
		);
		console.log(assemblies);
	}
</script>

<Label>
	Select an assembly
	<Select class="mt-2" items={assemblies} bind:value={selected} />
</Label>
{selected}
{#if !$assembliesSub.data}
	<p>No new messages</p>
{:else}
	<ul>
		{#each $assembliesSub.data.assemblies as assembly}
			<li style="color:{'red'}">{assembly.id}: "{assembly.name}"</li>
			<Instruction id={assembly}
		{/each}
	</ul>
{/if}
