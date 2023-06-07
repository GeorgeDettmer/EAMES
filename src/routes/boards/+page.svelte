<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
	import { page } from '$app/stores';
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
	<p>{$boardsQuery.error.message}</p>
{:else}
	<ul>
		{#each $boardsQuery.data.boards as board}
			<li
				style="color:{board.signoffsByBoardId.filter((s) => s.user.id == $page.data?.user?.id)
					.length > 0
					? 'red'
					: ''}"
			>
				{board.id}: {board.job.assembly.name}
				Signoffs:{JSON.stringify(board.signoffsByBoardId)}
			</li>
		{/each}
	</ul>
{/if}
