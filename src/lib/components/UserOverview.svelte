<script lang="ts">
	import { page } from '$app/stores';
	import { gql, getContextClient, queryStore } from '@urql/svelte';

	export let userId: string = $page?.data?.user?.id;

	$: userInfoStore = queryStore({
		client: getContextClient(),
		query: gql`
			query userInfo($userId: uuid!) {
				users_by_pk(id: $userId) {
					id
					first_name
					last_name
					initials
					color
					processes
				}
				instructions(distinct_on: type) {
					type
				}
			}
		`,
		variables: { userId }
	});

	$: instructionTypes = $userInfoStore?.data?.instructions?.map((i) => i?.type?.toUpperCase());
	$: userInfo = $userInfoStore?.data?.users_by_pk;
	$: userProcesses = userInfo?.processes;
	$: userProcessTypes = Object.keys(userProcesses)?.map((t) => t.toLocaleUpperCase());

	$: console.debug(userProcessTypes, instructionTypes);
</script>

<pre>{JSON.stringify(userInfo, null, 2)}</pre>
{#if $userInfoStore.fetching}
	<p>Loading...</p>
{:else if $userInfoStore.error}
	<h1 class="text-red-600">Part query error</h1>
	<p class="text-red-600">{$userInfoStore.error.message}</p>
{:else if instructionTypes?.length == 0}{:else}
	<div class="flex space-x-5">
		{#each instructionTypes as process, idx}
			{@const userHasProcess = userProcessTypes?.includes(process)}
			<p>
				{process}: {userHasProcess ? `✅` : '❌'}
			</p>
			{#if idx < instructionTypes.length - 1}
				<p>|</p>
			{/if}
		{:else}
			Loading
		{/each}
	</div>
{/if}
