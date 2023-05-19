<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	import { gql, getContextClient, queryStore } from '@urql/svelte';

	const boardsQuery = queryStore({
		client: getContextClient(),
		query: gql`
			query Boards {
				boards {
					id
					job {
						id
						quantity
						batch
						assembly {
							id
							name
						}
						customer {
							id
							name
						}
					}
					signoffsByBoardId {
						id
						type
						updated_at
						user {
							id
							initials
							first_name
							last_name
							username
						}
					}
				}
			}
		`
	});

	$: console.log($boardsQuery);
</script>

{#if $boardsQuery.fetching}
	<p>Loading...</p>
{:else if $boardsQuery.error}
	<p>Oopsie! {$boardsQuery.error.message}</p>
{:else}
	<ul>
		{#each $boardsQuery.data.boards as board}
			<li>
				{board.id}:
				<pre>{JSON.stringify(board)}</pre>
			</li>
		{/each}
	</ul>
{/if}
