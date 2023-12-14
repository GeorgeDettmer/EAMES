<script lang="ts">
	import { EditOutline } from 'flowbite-svelte-icons';
	import { createEventDispatcher } from 'svelte';
	import { XMark } from 'svelte-heros-v2';

	export let editing = false;

	const dispatch = createEventDispatcher();

	function click(type: string) {
		dispatch(type || 'click');
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div {...$$restProps}>
	<div class="flex">
		{#if editing}
			<slot name="save">
				<img
					style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(70deg)"
					width="16"
					height="16"
					src="https://img.icons8.com/ios/50/save--v1.png"
					alt="save"
					on:click={() => {
						click('save');
					}}
				/>
			</slot>
		{:else}
			<slot name="edit">
				<EditOutline size="sm" on:click />
			</slot>
		{/if}
		<slot name="dispose">
			<span
				class:invisible={!editing}
				on:click={() => {
					click('dispose');
				}}
			>
				<XMark size="16" />
			</span>
		</slot>
	</div>
</div>
