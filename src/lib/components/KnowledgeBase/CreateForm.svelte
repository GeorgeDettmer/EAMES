<script lang="ts">
	import { page } from '$app/stores';
	import { getContextClient, gql } from '@urql/svelte';
	import { Textarea, Toolbar, ToolbarButton, ToolbarGroup } from 'flowbite-svelte';
	import { ImageOutline, PapperPlaneOutline } from 'flowbite-svelte-icons';

	export let kbId: string;

	let value = '';
	const urqlClient = getContextClient();
	async function submit() {
		let mutationResult;
		mutationResult = await urqlClient.mutation(
			gql`
				mutation insertKb($kbId: uuid!, $content: String!) {
					insert_kb(objects: [{ kb_id: $kbId, content: $content }]) {
						affected_rows
						returning {
							id
						}
					}
				}
			`,
			{ kbId, content: value }
		);
		error = mutationResult?.error?.message;
		console.log(mutationResult);
		mutationResult = undefined;
		value = '';
	}
	let error: string | undefined = '';
</script>

<Textarea placeholder="Your knowledge base content..." rows="6" bind:value>
	<Toolbar slot="header" embedded>
		<ToolbarGroup>
			<ToolbarButton name="Upload image">
				<ImageOutline class="w-5 h-5" />
			</ToolbarButton>
		</ToolbarGroup>
		<ToolbarButton name="send" slot="end">
			<PapperPlaneOutline class="w-5 h-5 rotate-45" on:click={submit} />
		</ToolbarButton>
	</Toolbar>
	{#if error}
		<Toolbar slot="footer" embedded>
			<p class="">Error: {error}</p>
		</Toolbar>
	{/if}
</Textarea>
