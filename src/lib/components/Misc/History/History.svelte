<script lang="ts">
	import UserIcon from '$lib/components/UserIcon.svelte';
	import { classes, datetimeFormat } from '$lib/utils';
	import { queryStore, getContextClient, gql } from '@urql/svelte';
	import { Timeline, TimelineItem } from 'flowbite-svelte';
	import { EditOutline, PlusOutline } from 'flowbite-svelte-icons';
	import moment from 'moment';
	import { XCircle, CheckCircle, ChevronDoubleDown, PlusCircle, XMark } from 'svelte-heros-v2';

	export let id: string | number;
	export let table: string;
	export let schema: string = 'public';
	export let limit: number = 5;

	export let hasHistory: boolean = false;

	$: historyStore = queryStore({
		client: getContextClient(),
		query: gql`
			query history($id: String!, $schema: String! = "public", $table: String!) {
				history(
					where: { schemaname: { _eq: $schema }, tabname: { _eq: $table }, new_val: { _contains: { id: $id } } }
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
		variables: { id, table, schema },
		requestPolicy: 'cache-and-network'
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
		requestPolicy: 'cache-and-network'
	});

	let slice = limit;
	$: histories = $historyStore?.data?.history.slice(0, slice) /* ?.toReversed() */;
	$: more = Math.max($historyStore?.data?.history?.length - slice, 0);
	$: userIds = histories?.map((h) => h?.new_val?.user_id);
	$: users = $usersStore?.data?.users;
	$: console.log('histories', histories, $historyStore, $usersStore, users);

	$: hasHistory = histories?.length > 0;
</script>

<div>
	{#if $historyStore.fetching}
		<p>Loading...</p>
	{:else if $historyStore.error}
		<h1 class="text-red-600">History query error</h1>
		<p class="text-red-600">{$historyStore.error.message}</p>
	{:else if histories?.length == 0}
		<p>No edit history</p>
	{:else}
		<ol class="space-y-1">
			{#each histories as history, idx (history.id)}
				{@const user = users?.find(
					(u) => u.id == (history?.operation === 'DELETE' ? history?.old_val?.user_id : history?.new_val?.user_id)
				)}
				{@const historyEntries = Object.entries(history.new_val)}
				{#if user}
					<li class="border border-gray-500 rounded p-1">
						<div class="flex">
							<div class="-left-3 bg-white dark:bg-slate-800 relative my-auto">
								{#if history?.operation === 'DELETE'}
									<XMark variation="solid" size="20" class="text-red-600" />
								{:else if history?.operation === 'UPDATE'}
									<EditOutline size="sm" class="text-yellow-500" />
								{:else}
									<PlusOutline variation="solid" size="sm" class="text-green-500" />
								{/if}
							</div>
							<div class="flex gap-x-4 py-0.5">
								<div class="my-auto -space-y-1 float-right">
									<p class="text-xs">{datetimeFormat(history?.tstamp)}</p>
									<p class="text-xs italic text-right">
										{moment(history?.tstamp).fromNow().startsWith('in') ? 'moments ago' : moment(history?.tstamp).fromNow()}
									</p>
								</div>
								<div class="my-auto">
									<UserIcon {user} size="xs">
										{user?.first_name}
										{user?.last_name}
									</UserIcon>
								</div>
							</div>
						</div>
						<div class="">
							{#each historyEntries as [key, val], idx}
								{#if !['tracking', 'id', 'user_id', 'part_id', 'created_at', 'updated_at', 'order_id'].includes(key)}
									{#if history.operation === 'UPDATE' && history.old_val[key] !== val}
										<p class="text-xs"><span class="font-bold capitalize">{key}</span>: {history.old_val[key]} ▶ {val}</p>
									{/if}
								{/if}
							{/each}
						</div>
					</li>
				{/if}
			{/each}

			{#if more !== 0}
				<div class="flex">
					<div>
						<span
							class="flex absolute -left-3 justify-center items-center w-6 h-6 bg-primary-200 rounded-full ring-0 ring-white dark:ring-gray-900 dark:bg-primary-900"
						>
							<ChevronDoubleDown variation="mini" size="20" />
						</span>
					</div>
					<p
						on:click|stopPropagation={() => (slice += 5)}
						class={'mb-4 text-base font-normal text-gray-500 dark:text-gray-400' + classes.link}
					>
						{more} more...
					</p>
				</div>
			{/if}
		</ol>
	{/if}
</div>
