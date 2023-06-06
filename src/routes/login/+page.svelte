<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';

	export let form: ActionData;
</script>

<svelte:head>
	<title>Login</title>
</svelte:head>

<h1>Login</h1>

<section>
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
			<div class="notice error">
				{form.error}
			</div>
		{/if}
	</form>

	<div class="actions">
		<a href="/signup">Sign Up</a>
	</div>
</section>
