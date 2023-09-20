<script lang="ts">
	import { Modal } from 'flowbite-svelte';
	import type { SizeType } from 'flowbite-svelte/dist/types';
	import Content from './Content.svelte';

	export let visible: boolean = false;
	export let size: SizeType = 'lg';
	export let kbItem;
</script>

<Modal id="kbmodal" bind:open={visible} {size} autoclose={true} outsideclose={true}>
	<Content {kbItem} />
</Modal>
