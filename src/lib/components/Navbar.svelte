<script lang="ts">
	import { page } from '$app/stores';
	import { classes } from '$lib/utils';
	import { enhance } from '$app/forms';
	import UserIcon from '$lib/components/UserIcon.svelte';
	import LoginForm from '$lib/components/LoginForm.svelte';
	import { Toggle, Dropdown, DropdownItem, Button, Modal, Navbar, MegaMenu, Popover } from 'flowbite-svelte';
	import logo from '$lib/assets/easl-logo.png';
	import BoardOverview from './BoardOverview.svelte';
	import Barcode from './Barcode.svelte';
	import UserOverview from './UserOverview.svelte';
	import { fade } from 'svelte/transition';
	import { getContext } from 'svelte';
	import JobPopoverContent from './JobPopoverContent.svelte';
	import { goto } from '$app/navigation';
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
	const currentBoard = getContext('currentBoard');
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

	let menu = [
		{ name: 'About', href: '/about' },
		{ name: 'Help', href: '/help' },
		{ name: 'Report Issue', href: '/report/issue' }
	];
</script>

{#if showDebug_page}<pre>{JSON.stringify($page, null, 2)}</pre>{/if}
<Modal id="userInfo" bind:open={userInfoVisible} size="md" autoclose={true} outsideclose={true}>
	<UserOverview />
</Modal>

<Modal id="board" bind:open={boardVisible} size="xl" autoclose={true} outsideclose={true}>
	<BoardOverview boardId={$page.data?.boardId} />
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
		<Toggle on:click={toggleTheme} checked={window.document.documentElement.classList.contains('dark')}>Dark mode</Toggle>
		<Toggle
			on:click={() => {
				showDebug_page = !showDebug_page;
			}}
			checked={showDebug_page}>Show Debug: $page</Toggle
		>
	</form>
</Modal>

<div class="relative px-0">
	<Navbar navClass="px-1 sm:px-4 py-2.5 absolute w-full z-20 top-0 left-0 border-b" let:hidden let:toggle>
		<div class="cursor-pointer h-12 ring-indigo-800 hover:ring-4 hidden sm:flex" in:fade|global>
			<img src={logo} class="" alt="EASL" />
		</div>
		<MegaMenu full items={menu} let:item class="bg-slate-200">
			<a href={item.href} class="hover:underline hover:text-primary-600 dark:hover:text-primary-500">{item.name}</a>

			<a slot="extra" href="/" class="block mt-4 p-4 text-left bg-local rounded-lg">
				{#if user?.lastActivity}
					<div class="border-2 p-5 rounded-lg">
						<p class="mb-5 max-w-xl text-sm p-0 font-bold dark:text-white">
							Continue {user?.lastActivity?.process || 'THT'} on {user?.lastActivity?.job?.batch || 'EAS12345'}
						</p>
						<div class="flex">
							<Button color="blue" class="pr-10">Continue...</Button>
							<!-- 							<div
								class="mx-auto block mt-4 p-8 text-left bg-local bg-center overflow-visible bg-no-repeat bg-blend-multiply hover:bg-blend-soft-light dark:hover:bg-blend-darken"
								style="background-image: url(https://img.icons8.com/?size=64&id=BjUebvyTp8xO&format=png)"
							/> -->
						</div>
					</div>
				{/if}
				<div class="pt-10 flex">
					<p class="float-right font-italic">
						built by <span class="font-semibold italic">George Dettmer</span>
					</p>
				</div>
			</a>
		</MegaMenu>

		<div class="ml-1 sm:ml-10 flex-auto outline-gray-500">
			<div class="flex">
				<div class="grid grid-rows-2 grid-flow-col">
					<div class="px-2 row-span-3 rounded-bl-lg rounded-tl-lg border-2 border-slate-500">
						<Barcode
							boardId={$currentBoard?.boardInfo?.id?.toString()}
							on:click={() => {
								boardVisible = true;
							}}
						/>
					</div>
					{#if $currentBoard?.boardInfo?.id && $currentBoard?.boardInfo.job}
						<div
							class="px-2 font-semibold col-span-2 rounded-tr-lg border-2 border-l-0 border-b-0 border-slate-500 {'job-' +
								$currentBoard?.boardInfo.job?.id}"
						>
							EAS{$currentBoard?.boardInfo?.job?.batch}
						</div>
						<div
							class="px-2 font-semibold col-span-2 rounded-br-lg border-2 border-l-0 border-slate-500 {'job-' +
								$currentBoard?.boardInfo.job?.id}"
							on:click={() => goto('/kb/' + $currentBoard?.boardInfo?.assembly?.kb)}
						>
							<span class="font-normal">{$currentBoard?.boardInfo.job?.customer?.name}</span>
							{$currentBoard?.boardInfo?.assembly?.name} ({$currentBoard?.boardInfo?.assembly
								?.revision_external}:{$currentBoard?.boardInfo?.assembly?.revision_internal})
						</div>
						<Popover placement="bottom" triggeredBy={'.job-' + $currentBoard?.boardInfo.job?.id} class="w-64">
							<JobPopoverContent job={$currentBoard?.boardInfo.job} />
						</Popover>
					{/if}
				</div>
			</div>
		</div>

		<div class="flex items-center">
			<span>
				<UserIcon
					user={$page.data?.user}
					on:click={() => {
						console.log($page.data?.user);
						if ($page?.data?.user) {
							userVisible = !userVisible;
						} else {
							loginVisible = true;
						}
					}}
				>
					<p class="px-1 text-xl hidden md:block">
						{#if $page?.data?.user?.firstname && $page?.data?.user?.lastname}
							{$page?.data?.user?.firstname} {$page?.data?.user?.lastname}
						{:else if $page?.data?.user?.username}
							{$page?.data?.user?.username}
						{:else}
							Sign in
						{/if}
					</p>
					<div class:hidden={false}>
						<div class="w-full h-1 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
							<div class="bg-blue-700 overflow-hidden" role="progressbar" style={`height: ${(1000 / 100) * 5}%`} />
						</div>
					</div>
				</UserIcon>
			</span>
		</div>
		<Dropdown inline bind={userVisible}>
			<div slot="header" class="px-4 py-2">
				{#if $page?.data?.user}
					<span class="text-sm text-gray-900 dark:text-white">
						{$page?.data?.user?.firstname}
						{$page?.data?.user?.lastname}
					</span>
					<span
						class={'block truncate text-sm font-medium' + classes.link}
						on:click|stopPropagation={() => {
							userInfoVisible = true;
						}}
					>
						{$page?.data?.user?.username}
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

				<DropdownItem slot="footer">
					<form method="POST" action="/login?/logout" use:enhance>
						<button type="submit" name="logout" value="true">Logout</button>
					</form>
				</DropdownItem>
			{/if}
		</Dropdown>
	</Navbar>
</div>
