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

	$: console.log('userProcessTypes', userProcessTypes);
</script>

{#if $userInfoStore.fetching}
	<p>Loading...</p>
{:else if $userInfoStore.error}
	<h1 class="text-red-600">User query error</h1>
	<p class="text-red-600">{$userInfoStore.error.message}</p>
{:else if instructionTypes?.length == 0}{:else}
	<div class=" flex">
		<div class="p-4 mx-auto flex-col flex">
			<div class="flex-auto place-self-center">
				<UserIcon user={userInfo} size="lg" avatar={true}>
					<div class="flex flex-col items-center p-3">
						<h5 class="text-xl font-medium text-white">
							{[userInfo?.first_name, userInfo?.last_name].join(' ')}
						</h5>
						<span class="text-base text-gray-300">{userInfo?.username}</span>
					</div>
				</UserIcon>
			</div>

			<div class="">
				{#if userProcesses}
					<div class="flex space-x-2 mt-2 justify-center flex-wrap">
						{#each Object.entries(userProcesses) as [process, allowed], idx}
							<p class="font-semibold">
								{process.toUpperCase()}: {allowed ? `✅` : '❌'}
							</p>
							{#if idx < instructionTypes.length - 1}
								<p>|</p>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
