<script lang="ts">
	export let editable: boolean = true;
	export let innerText: string;

	$: {
		if (!innerText) {
			innerText = undefined;
		}
	}
</script>

{#if editable}
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<span
		class="px-0.5 focus:outline-none focus:ring-2 focus:ring-current cursor-pointer"
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
