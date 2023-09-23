<script lang="ts">
	import { gql, getContextClient, queryStore } from '@urql/svelte';
	import UserIcon from './UserIcon.svelte';
	import { onMount } from 'svelte';
	import { Timeline, Tooltip } from 'flowbite-svelte';
	import moment from 'moment';
	import { CheckCircle, ChevronDoubleDown, XCircle } from 'svelte-heros-v2';
	import TimelineItem from './TimelineItem.svelte';
	import { classes } from '$lib/utils';

	export let stepId: string;
	export let boardId: string;
	export let limit: number = 5;

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

	let slice = limit;
	$: histories = $historyStore?.data?.history.slice(0, slice);
	$: more = Math.max($historyStore?.data?.history?.length - slice, 0);
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
	<!-- <div class="flex">
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
	</div> -->

	<Timeline order="vertical">
		{#each histories as history, idx (history.id)}
			{@const user = users?.filter(
				(u) =>
					u.id ==
					(history?.operation === 'DELETE' ? history?.old_val?.user_id : history?.new_val?.user_id)
			)?.[0]}
			{#if user}<TimelineItem
					customLiClass="ml-4 !mb-0"
					date={moment(history?.tstamp).add(1, 'h').fromNow()}
				>
					<svelte:fragment slot="icon">
						<span
							class="flex absolute -left-3 justify-center items-center w-6 h-6 bg-primary-200 rounded-full ring-0 ring-white dark:ring-gray-900 dark:bg-primary-900"
						>
							{#if history?.operation === 'DELETE'}
								<XCircle variation="solid" size="20" class="text-red-600" />
							{:else}
								<CheckCircle variation="solid" size="20" class="text-green-500" />
							{/if}
						</span>
					</svelte:fragment>

					<UserIcon {user} size="sm">
						<p class="px-1">{user?.first_name} {user?.last_name}</p>
					</UserIcon>
				</TimelineItem>{/if}
		{/each}

		{#if more !== 0}
			<TimelineItem>
				<svelte:fragment slot="icon">
					<span
						class="flex absolute -left-3 justify-center items-center w-6 h-6 bg-primary-200 rounded-full ring-0 ring-white dark:ring-gray-900 dark:bg-primary-900"
					>
						<ChevronDoubleDown variation="mini" size="20" />
					</span>
				</svelte:fragment>
				<p
					on:click|stopPropagation={() => (slice += 5)}
					class={'mb-4 text-base font-normal text-gray-500 dark:text-gray-400' + classes.link}
				>
					{more} more...
				</p>
			</TimelineItem>
		{/if}
	</Timeline>
{/if}
