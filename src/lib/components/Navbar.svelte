<script lang="ts">
	import { dev } from '$app/environment';
	import { page } from '$app/stores';
	import { classes } from '$lib/utils';
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';
	import { getContext, onMount } from 'svelte';
	import { Toggle, Dropdown, DropdownItem, Modal, Navbar, Popover, Checkbox, Label, Helper } from 'flowbite-svelte';
	import {
		FileEditSolid,
		QuestionCircleSolid,
		ExclamationCircleSolid,
		ClipboardCheckSolid,
		ShoppingCartSolid,
		CheckPlusCircleSolid,
		DropboxSolid
	} from 'flowbite-svelte-icons';
	import { getPrinters, printerDetails, printerOnline } from '$lib/utils/bpac/bpac';
	import { openMenuGroupsStore, selectedPrinter, windowTitleStore } from '$lib/stores';

	import logo from '$lib/assets/easl-logo.png';

	import UserIcon from '$lib/components/UserIcon.svelte';
	import LoginForm from '$lib/components/LoginForm.svelte';
	import BoardOverview from './BoardOverview.svelte';
	import Barcode from './Barcode.svelte';
	import UserOverview from './UserOverview.svelte';
	import JobPopoverContent from './JobPopoverContent.svelte';
	import NavDrawer from './Navbar/NavDrawer.svelte';
	import { storage } from 'svelte-legos';

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

	let navDrawerHidden: boolean = true;
	let navDrawerSearch: undefined | string = undefined;

	let menu = [
		{ name: 'Help', href: '/help', icon: QuestionCircleSolid },
		{ name: 'Report Issue', href: '/report/issue', icon: ExclamationCircleSolid }
	];

	let menus = {
		purchasing: [
			{
				name: 'Orders',
				icon: FileEditSolid,
				items: [
					{ name: 'All Orders', href: '/order' },
					{ name: 'Create Order', href: '/order/createmulti' }
				]
			},
			{
				name: 'Suppliers',
				icon: ShoppingCartSolid,
				items: [
					{ name: 'All Suppliers', href: '/suppliers' },
					{ name: 'Create Supplier', href: '/add/supplier' }
				]
			}
		],
		stores: [
			{
				name: 'Receive',
				icon: ClipboardCheckSolid,
				items: [{ name: 'All To Receive', href: '/receiving' }]
			},
			{
				name: 'Kitting',
				icon: DropboxSolid,
				items: [
					/* { name: 'All kits', href: '/kitting/kits' }, */
					{ name: 'Kit Items', href: '/kitting' }
				]
			}
		],
		production: [
			{
				name: 'Board',
				icon: CheckPlusCircleSolid,
				href: '/board/25'
			}
		],
		'': menu
	};

	let printers: string[] = [];
	let printersState: any[] = [];
	onMount(async () => {
		printers = await getPrinters();
		let promises = printers.map(async (printer) => await printerDetails(printer));

		Promise.all(promises).then((x) => {
			console.log('printersDetails', x);
			printersState = x;
		});
	});
</script>

<svelte:window
	on:keydown={(e) => {
		if (e.key === '`') {
			console.log(e, 'Draw visible:', !navDrawerHidden);
			e.preventDefault();
			navDrawerHidden = !navDrawerHidden;
			if (!navDrawerHidden) {
				navDrawerSearch = '';
			}
		}
	}}
/>

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
	<div>
		<p>Printers:</p>
		<!-- {#each printers as printer, idx}
			<p>
				{printer}
				{#await printerOnline(printer) then online}
					{online ? '✅' : '❌'}
				{/await}

				{#await printerDetails(printer) then details}
					[Media: {details.mediaName}({details.mediaId})]
				{/await}
			</p>
		{:else}
			<p>No printers...</p>
		{/each} -->
		{#if printers?.[0]}
			<ul>
				{#each printers as printer, idx}
					<li class="rounded p-0.5 hover:bg-gray-100 dark:hover:bg-gray-600 uppercase">
						<Label class={'flex items-center'}>
							<input
								type="radio"
								on:change={() => ($selectedPrinter = printer)}
								checked={$selectedPrinter === printer}
								value={printer}
								class={'mr-2 w-4 h-4 bg-gray-100 border-gray-300 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'}
							/>
							{#await printerOnline(printer) then online}
								<span class:text-red-600={!online}>
									{printer}<span class="ml-2 italic text-xs"> {online ? '' : '(OFFLINE)'}</span>
								</span>
							{/await}
						</Label>
						{#await printerDetails(printer) then details}
							<Helper class="pl-6">
								{details?.mediaName}
								{#if details?.mediaId}
									({details?.mediaId})
								{/if}
							</Helper>
						{/await}
					</li>
				{:else}
					<p>No printers found?...</p>
				{/each}
			</ul>
		{:else}
			<p>No printers found...</p>
		{/if}
	</div>
</Modal>

<NavDrawer bind:hidden={navDrawerHidden} bind:search={navDrawerSearch} bind:menus openMenuGroups={openMenuGroupsStore} />
<!-- <div class="relative px-0"> -->
<Navbar navClass="px-1 py-1 w-full fixed z-20 top-0 left-0 border-b" let:hidden let:toggle>
	<div class="h-12 ring-blue-900 ring-opacity-75 bg-indigo-950 rounded-sm flex" in:fade|global>
		<img
			src={logo}
			class="cursor-pointer p-0.5 hover:p-1"
			alt="EASL"
			on:click={() => (navDrawerHidden = !navDrawerHidden)}
		/>
		{#if dev}
			<div class="flex w-0">
				<p class="font-extrabold text-lg -rotate-90 tracking-widest -ml-0 text-orange-500 animate-pulse">DEV</p>
			</div>
		{/if}
	</div>
	<div>
		<p class="text-xl font-semibold">{$windowTitleStore}</p>
	</div>

	<div class="ml-1 sm:ml-10 flex-auto outline-gray-500" class:hidden={!$page.url.pathname.startsWith('/board')}>
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
					>
						<a
							class="cursor-pointer"
							target="_blank"
							href={window.origin + '/assembly/' + $currentBoard?.boardInfo?.assembly?.id}
						>
							<span class="font-normal">{$currentBoard?.boardInfo.job?.customer?.name}</span>
							{$currentBoard?.boardInfo?.assembly?.name} ({$currentBoard?.boardInfo?.assembly
								?.revision_external}:{$currentBoard?.boardInfo?.assembly?.revision_internal})</a
						>
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
				size="sm"
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
				<div class:hidden={true}>
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
<!-- </div> -->
