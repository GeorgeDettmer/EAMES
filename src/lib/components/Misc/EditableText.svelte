<script lang="ts">
	export let editable: boolean = true;
	export let innerText: string;
</script>

{#if editable}
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<span
		class="p-1 focus:outline-none focus:ring-1 focus:ring-current"
		contenteditable="true"
		bind:innerText
		on:keydown={(e) => {
			if (e.key === 'Enter') {
				e.target?.blur();
				e.preventDefault();
			}
		}}
		on:keydown
		on:blur
	/>
{:else}
	{innerText}
{/if}
