<script lang="ts">
	import { Card, Button, Hr } from 'flowbite-svelte';
	import { ArrowLeftOutline, ArrowRightOutline } from 'flowbite-svelte-icons';
	import ViewerFromJson from './ViewerFromJSON.svelte';
	import { createEventDispatcher } from 'svelte';
	import { classes } from '$lib/utils';
	import PartInfo from './PartInfo.svelte';
	import { XMark } from 'svelte-heros-v2';
	const dispatch = createEventDispatcher();
	export let json;
	export let component;
</script>

<div class="w-full my-1">
	<Card size="xl">
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
		<a
			target="_blank"
			href={`https://octopart.com/search?q=${component?.component?.device}&currency=GBP`}
			class={classes.link}>{component?.component?.device}</a
		>
		<PartInfo partId={component?.component?.device} partLinkVisible={false} />

		<ViewerFromJson {json} />
	</Card>
</div>
