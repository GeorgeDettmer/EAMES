<script lang="ts">
	import { Button, Avatar } from 'flowbite-svelte';
	import '$lib/utils/stringUtils';
	export let user;
	export let size = 'md';

	export let avatarClass = ` mr-2 font-bold text-${['xs', 'sm'].includes(size) ? size : 'xl'} `;
	export let buttonClass = ` !p-1 !pr-2 text-white `;
</script>

{#if $$slots.default}
	<Button
		{size}
		pill
		color="light"
		class={buttonClass}
		style={user?.profile?.colour
			? `background-color:${user?.profile?.colour}`
			: 'background-color:#64748b'}
	>
		<Avatar {size} class={avatarClass}>
			{#if user?.profile?.name?.initials}
				{user?.profile?.name?.initials}
			{:else if user?.profile?.name?.first && user?.profile?.name?.last}
				{[user?.profile?.name?.first, user?.profile?.name?.last].join(' ').getInitials()}
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-6 h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
					/>
				</svg>
			{/if}
		</Avatar>
		<slot />
	</Button>
{:else}
	<Avatar
		{size}
		class={avatarClass + 'ml-2 text-white'}
		style={user?.profile?.colour
			? `background-color:${user?.profile?.colour}`
			: 'background-color:#64748b'}
	>
		{#if user?.profile?.name?.initials}
			<span class="text-white">{user?.profile?.name?.initials}</span>
		{:else if user?.profile?.name?.first && user?.profile?.name?.last}
			<span class="text-white"
				>{[user?.profile?.name?.first, user?.profile?.name?.last].join(' ').getInitials()}</span
			>
		{:else}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="w-6 h-6"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
				/>
			</svg>
		{/if}
	</Avatar>
{/if}
