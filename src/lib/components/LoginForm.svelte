<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { createEventDispatcher } from 'svelte';
	import { Label, Input, Hr, Card, Alert } from 'flowbite-svelte';
	import { getContextClient, gql, queryStore } from '@urql/svelte';

	export let classes = 'max-w-sm';
	classes += ' flex flex-col space-y-4';

	export let allowPassword = !localStorage.hasOwnProperty('EAMES_loginNoPassword');
	export let allowPasscode = !localStorage.hasOwnProperty('EAMES_loginNoPasscode');
	export let allowToken = !localStorage.hasOwnProperty('EAMES_loginNoToken');
	export let password = '';
	export let passcode = '';
	export let token = '';
	export let username = '';

	const dispatch = createEventDispatcher();

	let showPassword = false;
	let showToken = false;
	let showScanner = false;

	let submitButton: HTMLButtonElement;

	function handleLoginKeyup(e: KeyboardEvent) {
		const key = e?.key;
		if (key == 'Enter') {
			submitButton?.click();
			//TODO: FIX: Not set unless on /login route
			if (!$page?.form?.error) {
				dispatch('submit');
			}
		}
		if (key == 'Escape') {
			username = '';
			passcode = '';
			password = '';
			token = '';
		}
	}

	$: tokenDisabled = password != '' || passcode != '' || username != '';
	$: userPassDisabled = token != '';

	$: usersStore = queryStore({
		client: getContextClient(),
		query: gql`
			query users {
				users(where: { active: { _eq: true } }, order_by: { username: asc }) {
					id
					username
					first_name
					last_name
					initials
					color
				}
			}
		`
	});
	$: users = $usersStore?.data?.users || [];
	$: console.log($usersStore?.data);
</script>

<form
	class={classes}
	method="post"
	action="/login?/login"
	autocomplete="off"
	use:enhance
	on:keyup={(e) => {
		handleLoginKeyup(e);
	}}
>
	{#if !showScanner}
		{#if allowPassword || allowPasscode}
			<datalist id="usernames">
				{#each users as user}
					<option value={user.username} />
				{/each}
			</datalist>
			<Label class="space-y-2" for="username">
				<span class:text-gray-400={userPassDisabled}>Username</span>
				<Input list="usernames" type="text" name="username" disabled={userPassDisabled} bind:value={username} />
			</Label>
		{/if}
		{#if allowPassword || allowPasscode}
			<Label class="space-y-2" for="password">
				<span class:text-gray-400={userPassDisabled}
					>{allowPasscode && allowPassword ? 'Password/Passcode' : allowPasscode ? 'Passcode' : 'Password'}</span
				>
				<Input
					style={showPassword ? (!allowPassword ? '-webkit-text-security: none;' : 'none') : '-webkit-text-security: disc;'}
					type="text"
					name="password"
					disabled={userPassDisabled}
					bind:value={password}
					on:keydown={(e) => {
						if (allowPassword) return;
						console.log(e?.key);
						const isValid = [
							...[...Array(10).keys()].map((n) => n.toString()),
							'Escape',
							'Enter',
							'ArrowLeft',
							'ArrowRight',
							'Tab',
							'Backspace',
							'Delete'
						].includes(e?.key);
						if (!isValid) {
							e.preventDefault();
						}
					}}
				>
					<button
						tabindex="-1"
						slot="left"
						on:click|preventDefault={() => (showPassword = !showPassword)}
						class="pointer-events-auto"
					>
						{#if showPassword}
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
									d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
								/>
								<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
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
									d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
								/>
							</svg>
						{/if}
					</button>
				</Input>
			</Label>
		{/if}
		{#if (allowPasscode || allowPassword) && allowToken}
			<Hr class="my-1" width="w-64">or</Hr>{/if}
	{/if}
	{#if allowToken}
		<Label class="space-y-2" for="login_token">
			<span class:text-gray-400={tokenDisabled}>Token</span>
			<Input type={showToken ? 'text' : 'password'} name="login_token" disabled={tokenDisabled} bind:value={token}>
				<button
					tabindex="-1"
					slot="left"
					on:click|preventDefault={() => (showToken = !showToken)}
					class="pointer-events-auto"
				>
					{#if showToken}
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
								d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
							/>
							<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
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
								d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
							/>
						</svg>
					{/if}
				</button>
				<button
					tabindex="-1"
					slot="right"
					on:click|preventDefault={() => {
						showScanner = !showScanner;
					}}
					class="pointer-events-auto"
				>
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
							d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"
						/>
					</svg>
				</button>
			</Input>
		</Label>
	{/if}
	{#if showScanner}
		<div>
			<Card img="/images/image-1.webp">
				<div id="video-container">
					<video id="qr-video" />
				</div>
				<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
					<!-- {#if videoLoading} -->
					Loading camera
					<!-- {:else}
						Present your token to your camera
					{/if} -->
				</p>
			</Card>
		</div>
	{/if}
	<button
		bind:this={submitButton}
		type="submit"
		class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Login</button
	>
	{#if $page.form?.error}
		<Alert color="red">
			<svg
				slot="icon"
				aria-hidden="true"
				class="w-5 h-5"
				fill="currentColor"
				viewBox="0 0 20 20"
				xmlns="http://www.w3.org/2000/svg"
				><path
					fill-rule="evenodd"
					d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
					clip-rule="evenodd"
				/></svg
			>
			<span class="font-medium">Invalid credentials!</span>
			<p>{$page.form.error}</p>
		</Alert>
	{/if}
</form>
