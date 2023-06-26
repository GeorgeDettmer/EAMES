<script lang="ts">
	import { gql, getContextClient, queryStore } from '@urql/svelte';
	import UserIcon from './UserIcon.svelte';
	import { onMount } from 'svelte';
	import { Tooltip } from 'flowbite-svelte';
	import moment from 'moment';

	export let stepId: string;
	export let boardId: string;

	$: historyStore = queryStore({
		client: getContextClient(),
		query: gql`
			query history($stepId: uuid!, $boardId: bigint!) {
				history(
					where: {
						_and: {
							new_val: { _contains: { board_id: $boardId } }
							_and: { new_val: { _contains: { step_id: $stepId } } }
						}
					}
					order_by: { id: desc }
				) {
					id
					operation
					tstamp
					new_val
					old_val
					tabname
				}
			}
		`,
		variables: { stepId, boardId: parseInt(boardId) },
		requestPolicy: 'network-only'
	});

	$: usersStore = queryStore({
		client: getContextClient(),
		query: gql`
			query users($userIds: [uuid!]) {
				users(where: { id: { _in: $userIds } }) {
					id
					username
					first_name
					last_name
					initials
					color
					processes
				}
			}
		`,
		variables: { userIds },
		requestPolicy: 'network-only'
	});

	$: histories = $historyStore?.data?.history;
	$: userIds = histories?.map((h) => h?.new_val?.user_id);
	$: users = $usersStore?.data?.users;
	$: console.log('histories', histories, $usersStore, users);
	onMount(() => {
		console.log('history', boardId, stepId);
	});
</script>

{#if $historyStore.fetching}
	<p>Loading...</p>
{:else if $historyStore.error}
	<h1 class="text-red-600">History query error</h1>
	<p class="text-red-600">{$historyStore.error.message}</p>
{:else if histories?.length == 0}
	<p>No signoff history</p>
{:else}
	<div class="flex">
		<div class="p-4 mx-auto flex-col">
			<div class="">
				<div class="flex space-x-2 mt-2 justify-center flex-wrap">
					{#each histories as history, idx (history.id)}
						{@const user = users?.filter((u) => u.id == history?.new_val?.user_id)?.[0]}
						<div class="flex">
							<p>{history.id}</p>
							<UserIcon {user} size="sm">
								<p class="pl-1">
									{history?.operation === 'DELETE' ? '❌' : '✅'}
									{moment(history?.tstamp).add(1, 'h').fromNow()}
								</p>
							</UserIcon>
						</div>
						<Tooltip color="green" placement="left"
							>{moment(history?.tstamp).add(1, 'h').format('HH:MM:ss DD/MM/YY')}</Tooltip
						>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
