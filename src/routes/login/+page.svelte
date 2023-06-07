<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';

	import { Alert } from 'flowbite-svelte';

	export let form: ActionData;
</script>

<svelte:head>
	<title>Login</title>
</svelte:head>

<h1 class="text-3xl font-bold underline">Login</h1>

<form method="post" action="?/login" use:enhance>
	<div class="group">
		<label for="username">Username</label>
		<input type="username" name="username" id="username" />
	</div>

	<div class="group">
		<label for="password">Password</label>
		<input type="password" name="password" id="password" />
	</div>

	<div class="group">
		<label for="login_token">Token</label>
		<input type="password" name="login_token" id="token" />
	</div>

	<div class="submit-container">
		<button type="submit">Login</button>
	</div>

	{#if form?.error}
		<Alert border color="yellow">
			<span slot="icon"
				><svg
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
			</span>
			<span class="font-medium">Warning alert!</span>
			{form.error}
		</Alert>
	{/if}
</form>

<div class="actions">
	<a href="/signup">Sign Up</a>
</div>
