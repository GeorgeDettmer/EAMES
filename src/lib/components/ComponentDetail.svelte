<script lang="ts">
	import { Card, Button, Hr } from 'flowbite-svelte';
	import { ArrowLeftOutline, ArrowRightOutline } from 'flowbite-svelte-icons';
	import ViewerFromJson from './ViewerFromJSON.svelte';
	import { createEventDispatcher } from 'svelte';
	import PartInfo from './PartInfo.svelte';
	import { XMark } from 'svelte-heros-v2';
	const dispatch = createEventDispatcher();
	export let json;
	export let component;
</script>

<div>
	<Card class="m-1 w-full">
		<div class="flex justify-between">
			<div class="py-1">
				<h5 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
					{component?.component?.component}
				</h5>
				<p class="text-xs">{component?.component?.shape}</p>
			</div>
			<XMark
				on:click={() => dispatch('back')}
				class="dark:text-white text-center cursor-pointer opacity-75 hover:opacity-100"
			/>
		</div>
		<Hr />
		<PartInfo partId={component?.component?.device} />

		<ViewerFromJson {json} />
	</Card>
</div>
