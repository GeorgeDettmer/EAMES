<script lang="ts">
	import { page } from '$app/stores';
	import { classes } from '$lib/utils';
	import { enhance } from '$app/forms';
	import UserIcon from '$lib/components/UserIcon.svelte';
	import LoginForm from '$lib/components/LoginForm.svelte';
	import {
		Alert,
		Toggle,
		Dropdown,
		DropdownItem,
		Button,
		Modal,
		Navbar,
		NavBrand,
		NavLi,
		NavUl,
		NavHamburger,
		Popover
	} from 'flowbite-svelte';
	//export let currentSerial = $board.sn;
	import logo from '$lib/assets/easl-logo.png';
	import BoardOverview from './BoardOverview.svelte';
	import Barcode from './Barcode.svelte';
	import UserOverview from './UserOverview.svelte';
	//Modal toggles
	let settingsVisible = false;
	let boardVisible = false;
	let userVisible = false;
	let loginVisible = false;
	let userInfoVisible = false;

	let token = '';
	let password = '';
	let username = '';

	$: user = $page.data?.user;

	const toggleTheme = () => {
		const isDark = window.document.documentElement.classList.toggle('dark');
		localStorage.setItem('color-theme', isDark ? 'dark' : 'light');
	};

	let showDebug_page = false;

	function handleLoginKeyup(e) {
		if (e.key == 'Enter') {
			handleLoginClick();
		}
	}

	function handleLoginSubmit(e) {
		console.log(e);
		token = '';
		username = '';
		password = '';
		loginVisible = false;
	}

	function handleLoginClick() {
		if (token) {
			console.log('TOKEN');
			token = '';
			loginVisible = false;
		}
		if (username && password) {
			console.log('USER/PASS');
			username = '';
			password = '';
			loginVisible = false;
		}
	}

	function navigateTo(nav: string) {
		console.log('PROXY navigateTo', nav);
	}
</script>

{#if showDebug_page}<pre>{JSON.stringify($page, null, 2)}</pre>{/if}
<Modal id="userInfo" bind:open={userInfoVisible} size="md" autoclose={true} outsideclose={true}>
	<UserOverview />
</Modal>

<Modal id="board" bind:open={boardVisible} size="xl" autoclose={true} outsideclose={true}>
	<BoardOverview boardId={parseInt($page.data?.boardId)} />
</Modal>

<Modal id="login" bind:open={loginVisible} size="xs" autoclose={false} outsideclose={true}>
	<LoginForm
		on:submit={() => {
			loginVisible = false;
		}}
	/>
</Modal>

<Modal id="settings" bind:open={settingsVisible} size="xs" autoclose={true} outsideclose={true}>
	<form class="flex flex-col space-y-6">
		<h3 class="text-xl font-medium text-gray-900 dark:text-white p-0">Settings</h3>
		<Toggle
			on:click={toggleTheme}
			checked={window.document.documentElement.classList.contains('dark')}>Dark mode</Toggle
		>
		<Toggle
			on:click={() => {
				showDebug_page = !showDebug_page;
			}}
			checked={showDebug_page}>Show Debug: $page</Toggle
		>
	</form>
</Modal>

<div class="relative px-0">
	<Navbar
		navClass="px-2 sm:px-4 py-2.5 absolute w-full z-20 top-0 left-0 border-b"
		let:hidden
		let:toggle
	>
		<NavBrand href="/">
			<img src={logo} class="mr-1 h-6 sm:h-9" alt="EASL" />
			<span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">EASL</span>
		</NavBrand>
		<Barcode
			boardId={$page?.data?.boardId}
			on:click={() => {
				boardVisible = true;
			}}
		/>
		<NavHamburger on:click={toggle} />
		<!-- <NavUl {hidden}>
			<NavLi href="/boards">Boards</NavLi>
		</NavUl>
		<NavUl {hidden}>
			<NavLi href="/instructions">Instruction</NavLi>
		</NavUl> -->

		<div class="flex items-center">
			<div class="pr-1" class:hidden={true}>
				<div
					class="flex flex-col flex-nowrap justify-end w-2 h-12 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700"
				>
					<div
						class="bg-blue-700 overflow-hidden"
						role="progressbar"
						style={`height: ${(1000 / 100) * 5}%`}
					/>
				</div>
			</div>

			<span>
				<UserIcon user={$page.data?.user} on:click={() => (userVisible = !userVisible)}>
					<p class="px-1">
						{$page.data?.user?.firstname || $page.data?.user?.username || 'Sign in'}
					</p>
				</UserIcon>
			</span>
		</div>
		<Dropdown inline bind={userVisible}>
			<div slot="header" class="px-4 py-2">
				{#if user}
					<span class="block text-sm text-gray-900 dark:text-white">
						{user?.firstname}
						{user?.lastname}
					</span>
					<span
						class={'block truncate text-sm font-medium' + classes.link}
						on:click|stopPropagation={() => {
							userInfoVisible = true;
						}}
					>
						{user?.username}
					</span>
				{:else}
					<DropdownItem slot="footer" on:click={() => (loginVisible = true)}>Sign in</DropdownItem>
				{/if}
			</div>
			<DropdownItem on:click={() => (settingsVisible = true)}>Settings</DropdownItem>
			{#if user}
				<DropdownItem
					slot="footer"
					on:click={() => {
						loginVisible = true;
					}}>Switch user</DropdownItem
				>

				<DropdownItem slot="footer"
					><form method="POST" action="/login?/logout" use:enhance>
						<button type="submit" name="logout" value="true">Logout</button>
					</form></DropdownItem
				>
			{/if}
		</Dropdown>
	</Navbar>
</div>
