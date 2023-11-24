<script lang="ts">
	import { TableBodyCell } from 'flowbite-svelte';
	import type { HTMLInputTypeAttribute } from 'svelte/elements';

	export let value = '';
	export let editing = false;
	export let inputType: HTMLInputTypeAttribute | 'dropdown' = 'text';
	export let tdClass: string | undefined = undefined;
	export let adjustWidthToFit: boolean = true;

	interface Options {
		id: string | number;
		text?: string;
	}
	export let options: Options[] = [];

	let input: HTMLInputElement | HTMLSelectElement;
	$: {
		if (editing && input) {
			input.focus();
			adjustWidth(input);
		}
	}

	function adjustWidth(input: HTMLInputElement) {
		if (!adjustWidthToFit) return;
		if (inputType === 'dropdown') {
			input.width = input.value.length || 1;
			return;
		}
		input.size = input.value.length || 1;
	}
</script>

<TableBodyCell
	on:click={(e) => {
		editing = true;
	}}
	{tdClass}
>
	{#if editing}
		{#if inputType === 'dropdown'}
			<select
				class="mx-auto w-fit block text-xs text-center disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded p-0"
				bind:value
				bind:this={input}
				on:change={(e) => (editing = false)}
				on:focusout={(e) => (editing = false)}
			>
				{#each options as { id, text }}
					<option value={id}>
						{text || id}
					</option>
				{/each}
			</select>
		{:else if inputType === 'number'}
			<input
				class="mx-auto w-fit block text-center text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded p-0"
				type="number"
				bind:value
				bind:this={input}
				on:change={(e) => (editing = false)}
				on:focusout={(e) => (editing = false)}
				on:input={(e) => {
					value = Math.max(Number(value), 1);
					adjustWidth(input);
				}}
				on:mousewheel={(e) => {
					value = Math.max(Number(value) + (e.deltaY > 0 ? -1 : +1), 1);
				}}
			/>
		{:else}
			<input
				class="mx-auto text-center w-fit block text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded p-0"
				bind:value
				bind:this={input}
				on:change={(e) => (editing = false)}
				on:focusout={(e) => (editing = false)}
				on:input={(e) => {
					adjustWidth(input);
				}}
			/>
		{/if}
	{:else}
		<slot />
	{/if}
</TableBodyCell>
