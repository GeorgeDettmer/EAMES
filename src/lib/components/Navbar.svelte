<script lang="ts">
	import { page } from '$app/stores';

	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
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
		NavHamburger
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
	<LoginForm />
	<!-- <form
		class="flex flex-col space-y-6"
		method="post"
		action="/login?/login"
		use:enhance
		on:submit={handleLoginSubmit}
	>
		<h3 class="text-xl font-medium text-gray-900 dark:text-white p-0">Sign in</h3>
		<div class="group">
			<label for="username">Username</label>
			<input
				type="text"
				name="username"
				id="username"
				disabled={token != ''}
				bind:value={username}
			/>
		</div>

		<div class="group">
			<label for="password">Password</label>
			<input
				type="password"
				name="password"
				id="password"
				disabled={token != ''}
				bind:value={password}
			/>
		</div>

		<div class="group">
			<label for="login_token">Token</label>
			<input
				type="password"
				name="login_token"
				id="token"
				disabled={password != '' || username != ''}
				bind:value={token}
			/>
		</div>

		<div class="submit-container">
			<button type="submit">Login</button>
		</div>
	</form> -->
	<!-- <form
		class="flex flex-col space-y-6"
		method="post"
		action="/login?/login"
		use:enhance
		on:keyup={(e) => handleLoginKeyup(e)}
	>
		<h3 class="text-xl font-medium text-gray-900 dark:text-white p-0">Sign in</h3>
		<Label for="username">Username</Label>
		<Input type="text" name="username" disabled={token != ''} bind:value={username} />

		<Label for="password">Password</Label>
		<Input
			type={showPassword ? 'text' : 'password'}
			name="password"
			disabled={token != ''}
			bind:value={password}
		/>

		<Hr class="my-1" width="w-64">or</Hr>
		<Label for="login_token">Token</Label>
		<Input
			type={showToken ? 'text' : 'password'}
			name="login_token"
			disabled={password != '' || username != ''}
			bind:value={token}
		/>
		<button
			type="submit"
			class="w-full"
			disabled={username == '' && password == '' && token == ''}
			on:click={() => handleLoginClick()}>Login</button
		>
	</form> -->
</Modal>

<Modal id="settings" bind:open={settingsVisible} size="xs" autoclose={false}>
	<form class="flex flex-col space-y-6">
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
				<UserIcon user={$page.data?.user} on:click={() => (userVisible = !userVisible)}>
					{$page.data?.user?.firstname || $page.data?.user?.username || 'Sign in'}
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
						class="block truncate text-sm font-medium"
						on:click|stopPropagation={navigateTo(`/users/${user._id}`)}
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
						handleLogout();
						loginVisible = true;
					}}>Switch user</DropdownItem
				>

				<DropdownItem slot="footer" on:click={() => handleLogout()}
					><form method="POST" action="/login?/logout" use:enhance>
						<button type="submit" name="logout" value="true">Logout</button>
					</form></DropdownItem
				>
			{/if}
		</Dropdown>
	</Navbar>
</div>
