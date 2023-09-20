<script lang="ts">
	import { getContextClient, gql, queryStore } from '@urql/svelte';
	import ListItem from './ListItem.svelte';
	import Modal from './Modal.svelte';

	export let kbId: string;
	export let kbInfo: boolean = false;
	export let kbItems: number = 0;

	$: kbInfoStore = queryStore({
		client: getContextClient(),
		query: gql`
			query kb($kbId: uuid) {
				kb(where: { kb_id: { _eq: $kbId } }, order_by: { updated_at: asc }) {
					id
					kb_id
					created_at
					updated_at
					user_id
					content
					images
					user {
						id
						first_name
						last_name
						initials
						color
						username
						processes
					}
					comments(order_by: { created_at: desc }) {
						id
						content
						images
						created_at
						updated_at
						user {
							id
							first_name
							last_name
							initials
							color
							username
							processes
						}
					}
				}
			}
		`,
		variables: { kbId }
	});
	$: kb = $kbInfoStore?.data?.kb;
	$: kbInfo = !!kb;
	$: currentKbItem = {};
	$: modalVisible = false;

	$: console.log($kbInfoStore, kb?.length);
	$: kbItems = kb?.length || 0;
</script>

<Modal bind:kbItem={currentKbItem} bind:visible={modalVisible} />

{#if $kbInfoStore.fetching}
	<p>Loading...</p>
{:else if $kbInfoStore.error}
	<h1 class="text-red-600">KnowledgeBase query error</h1>
	<p class="text-red-600">{$kbInfoStore.error.message}</p>
{:else if kbInfo}
	{#each kb as kbItem, kbIndex}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="cursor-pointer"
			on:click={(e) => {
				console.log('kbClick', kbItem, e);
				currentKbItem = kbItem;
				modalVisible = true;
			}}
		>
			<ListItem {kbItem} {kbIndex} />
		</div>
	{/each}
{/if}
