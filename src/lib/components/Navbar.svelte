<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import UserIcon from '$lib/components/UserIcon.svelte';
	import {
		Progressbar,
		Toggle,
		Avatar,
		Dropdown,
		DropdownItem,
		Button,
		Modal,
		Label,
		Input,
		DarkMode,
		Hr,
		Card,
		Navbar,
		NavBrand,
		NavLi,
		NavUl,
		NavHamburger,
		DropdownDivider
	} from 'flowbite-svelte';
	//export let currentSerial = $board.sn;

	//Modal toggles
	let settingsVisible = false;
	let boardVisible = false;
	let userVisible = false;

	let loginVisible = false;
	let token = '';
	let password = '';
	let username = '';
	let showPassword = false;
	let showToken = false;
	let showScanner = false;

	$: user = $page.data?.user;

	const toggleTheme = () => {
		const isDark = window.document.documentElement.classList.toggle('dark');
		localStorage.setItem('color-theme', isDark ? 'dark' : 'light');
	};

	function handleLoginKeyup(e) {
		if (e.key == 'Enter') {
			handleLoginClick();
		}
	}

	function handleLoginClick() {
		if (token) {
			console.log('TOKEN');
		}
		if (username && password) {
			console.log('USER/PASS');
		}
	}

	function navigateTo(nav: string) {
		console.log('PROXY navigateTo', nav);
	}

	function handleLogout() {
		console.log('LOGOUT');
	}

	onMount(() => {
		console.log('onMounted');
	});
</script>

<!-- <Modal id="board" bind:open={boardVisible} size="xl" autoclose={false}>
	<Board id={$board.sn} signoffs={$board.processes} />
</Modal> -->

<Modal id="login" bind:open={loginVisible} size="xs" autoclose={false}>
	<form class="flex flex-col space-y-6" on:keyup={(e) => handleLoginKeyup(e)}>
		<h3 class="text-xl font-medium text-gray-900 dark:text-white p-0">Sign in</h3>
		{#if !showScanner}
			<Label class="space-y-2">
				<span>Username</span>
				<Input type="text" name="username" disabled={token != ''} required bind:value={username} />
			</Label>
			<Label class="space-y-2">
				<span>Password</span>
				<Input
					type={showPassword ? 'text' : 'password'}
					name="password"
					disabled={token != ''}
					required
					bind:value={password}
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
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
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
			<Hr class="my-1" width="w-64">or</Hr>
		{/if}
		<Label class="space-y-2">
			<span>Token</span>
			<Input
				type={showToken ? 'text' : 'password'}
				name="token"
				disabled={password != '' || username != ''}
				required
				bind:value={token}
			>
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
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
							/><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/></svg
						>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="w-6 h-6"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
							/></svg
						>
					{/if}
				</button>
				<button
					tabindex="-1"
					slot="right"
					on:click|preventDefault={() => {
						showScanner = !showScanner;
						//getVideoFeed();
					}}
					class="pointer-events-auto"
					disabled={false}
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
		{#if showScanner}
			<div>
				<Card img="/images/image-1.webp">
					<div id="video-container">
						<video id="qr-video" />
					</div>
					<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
						Present your token to your camera
					</p>
				</Card>
			</div>
		{/if}
		<Button
			class="w-full1"
			disabled={username == '' && password == '' && token == ''}
			on:click={() => handleLoginClick()}>Login</Button
		>
	</form>
</Modal>

<Modal id="settings" bind:open={settingsVisible} size="xs" autoclose={false}>
	<form class="flex flex-col space-y-6" on:keyup={(e) => handleSettingsKeyup(e)}>
		<h3 class="text-xl font-medium text-gray-900 dark:text-white p-0">Settings</h3>
		<Toggle
			on:click={toggleTheme}
			checked={window.document.documentElement.classList.contains('dark')}>Dark mode</Toggle
		>
	</form>
</Modal>

<div class="relative px-8">
	<Navbar
		navClass="px-2 sm:px-4 py-2.5 absolute w-full z-20 top-0 left-0 border-b"
		let:hidden
		let:toggle
	>
		<NavBrand href="/">
			<img src="easl-logo.png" class="mr-3 h-6 sm:h-9" alt="EASL" />
			<span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">EASL</span>
		</NavBrand>
		<NavHamburger on:click={toggle} />
		<NavUl {hidden}>
			<NavLi href="/boards">Boards</NavLi>
		</NavUl>
		<Button
			color="light"
			id="serial"
			class="!p-1 mr-6"
			on:click={() => (boardVisible = !boardVisible)}
		>
			<div>
				<div class="flex items-center justify-center">
					<img
						class="w-6"
						style:filter={'invert(0.5)'}
						src={'http://bwipjs-api.metafloor.com/?bcid=datamatrix&text=' + 'a4bd'}
					/>
				</div>
				<p alt="a4bd">a4bd</p>
			</div>
		</Button>

		<div class="flex items-center">
			<!-- <div class="pr-1" class:hidden={timeSinceActivity > 1000}>
				<div class="flex flex-col flex-nowrap justify-end w-2 h-12 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
					<div class="bg-blue-700 overflow-hidden" role="progressbar" style={`height: ${(1000 / 100) * timeSinceActivity}%`} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100" />
				</div>
			</div> -->

			<span>
				<UserIcon {user} on:click={() => (userVisible = !userVisible)}>
					{user?.profile?.name?.first || 'Sign in'}
				</UserIcon>
			</span>
		</div>
		<Dropdown inline bind={userVisible}>
			<div slot="header" class="px-4 py-2">
				{#if user}
					<!-- <span class="block text-sm text-gray-900 dark:text-white">
						{profile?.name?.first}
						{profile?.name?.last}
					</span>
					<span
						class="block truncate text-sm font-medium"
						on:click|stopPropagation={navigateTo(`/users/${user._id}`)}
					>
						{profile?.name?.username}
					</span> -->
				{:else}
					<DropdownItem slot="footer" on:click={() => (loginVisible = true)}>Sign in</DropdownItem>
				{/if}
			</div>
			<DropdownItem on:click={() => (settingsVisible = true)}>Settings</DropdownItem>
			{#if user}
				<DropdownItem
					slot="footer"
					on:click={() => {
						handleLogout();
						loginVisible = true;
					}}>Switch user</DropdownItem
				>
				<form method="POST" action="/login?/logout" use:enhance>
					<button type="submit" name="logout" value="true">Logout</button>
				</form>
				<!-- <DropdownItem slot="footer" on:click={() => handleLogout()}>Sign out</DropdownItem> -->
			{/if}
		</Dropdown>
	</Navbar>
</div>

<style>
	.navbar {
		background-color: #1d1a2b;
	}
</style>
