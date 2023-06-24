<script lang="ts">
	import { page } from '$app/stores';
	import { gql, getContextClient, queryStore } from '@urql/svelte';
	import UserIcon from './UserIcon.svelte';

	export let userId: string = $page?.data?.user?.id;

	$: userInfoStore = queryStore({
		client: getContextClient(),
		query: gql`
			query userInfo($userId: uuid!) {
				users_by_pk(id: $userId) {
					id
					username
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
	$: userProcessTypes = Object.keys(userProcesses || {})?.map((t) => t?.toUpperCase());
</script>

{#if $userInfoStore.fetching}
	<p>Loading...</p>
{:else if $userInfoStore.error}
	<h1 class="text-red-600">Part query error</h1>
	<p class="text-red-600">{$userInfoStore.error.message}</p>
{:else if instructionTypes?.length == 0}{:else}
	<div class="flex">
		<div class="p-4 mx-auto flex-col">
			<UserIcon user={userInfo} size="lg">
				<div class="flex flex-col items-center p-3">
					<h5 class="text-xl font-medium text-white">
						{[userInfo?.first_name, userInfo?.last_name].join(' ')}
					</h5>
					<span class="text-base text-gray-300">{userInfo?.username}</span>
				</div>
			</UserIcon>
			<div class="">
				<div class="flex space-x-2 mt-2 justify-center">
					{#each instructionTypes as process, idx}
						{@const userHasProcess = userProcessTypes?.includes(process)}
						<p class="font-semibold">
							{process}: {userHasProcess ? `✅` : '❌'}
						</p>
						{#if idx < instructionTypes.length - 1}
							<p>|</p>
						{/if}
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
