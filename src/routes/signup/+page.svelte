<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';

	export let form: ActionData;
</script>

<svelte:head>
	<title>Sign Up</title>
</svelte:head>

<h1>Sign Up</h1>

<section>
	<form method="post" use:enhance>
		<div class="group">
			<label for="username">Username</label>
			<input type="username" name="username" id="username" required />
		</div>

		<div class="group">
			<label for="firstname">Firstname</label>
			<input type="text" name="firstname" id="firstname" required />
		</div>

		<div class="group">
			<label for="lastname">Lastname</label>
			<input type="text" name="lastname" id="lastname" required />
		</div>

		<div class="group">
			<label for="password">Password</label>
			<input type="password" name="password" id="password" />
		</div>

		<div class="group">
			<label for="passcode">Passcode</label>
			<input type="password" name="passcode" id="passcode" />
		</div>

		<div class="submit-container">
			<button type="submit">Sign Up</button>
		</div>

		{#if form?.error}
			<div class="notice error">
				{form.error}
			</div>
		{/if}
	</form>

	<div class="actions">
		<a href="/login">Login</a>
	</div>
</section>
