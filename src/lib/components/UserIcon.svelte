<script lang="ts">
	import { Button, Avatar } from 'flowbite-svelte';

	export let user: any;
	export let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
	export let avatar: boolean = true;
	export let avatarClass: string = ` font-bold text-${['xs', 'sm'].includes(size) ? size : 'xl'} `;
	export let buttonClass: string = ` !p-0 !pr-2 text-white outline-none `;
</script>

{#if $$slots.default}
	<Button
		{size}
		pill
		color="light"
		class={buttonClass}
		style={user?.color ? `background-color:${user.color}80;` : 'background-color:#64748b80'}
	>
		{#if avatar}
			<Avatar
				style={user?.color ? `background-color:${user.color}` : 'background-color:#64748b'}
				{size}
				class={avatarClass + ' ring-white ring-1'}
			>
				{#if user?.initials}
					<p class="text-white text-center align-middle">{user.initials}</p>
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
		<div class="ml-1 text-black dark:text-white font-semibold">
			<slot />
		</div>
	</Button>
{:else}
	<Avatar
		{size}
		class={avatarClass + ' text-white ring-white ring-1'}
		style={user?.color ? `background-color:${user?.color}` : 'background-color:#64748b'}
	>
		{#if user?.initials}
			<span class="text-white">{user.initials}</span>
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
