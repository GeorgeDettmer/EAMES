<script lang="ts">
	import { Card, Button, Hr } from 'flowbite-svelte';
	import { ArrowLeftOutline, ArrowRightOutline } from 'flowbite-svelte-icons';
	import ViewerFromJson from './ViewerFromJSON.svelte';
	import { createEventDispatcher } from 'svelte';
	import { classes } from '$lib/utils';
	import PartInfo from './PartInfo.svelte';
	import { XMark } from 'svelte-heros-v2';
	import List from './KnowledgeBase/List.svelte';
	const dispatch = createEventDispatcher();
	export let json;
	export let component;
	export let kbId: string = '';
	let hasInfo: boolean = false;
</script>

<div class="w-full my-1">
	<Card size="xl">
		<div class="flex justify-between">
			<div class="py-1">
				<h5 class="text-2xl font-bold text-gray-900 dark:text-white">
					{component?.component?.component}
				</h5>
				<a
					target="_blank"
					href={`https://octopart.com/search?q=${component?.component?.device}&currency=GBP`}
					class={classes.link + 'font-bold'}>{component?.component?.device}</a
				>
				<p class="text-xs font-thin">{component?.component?.shape}</p>
			</div>
			<XMark
				on:click={() => dispatch('back')}
				class="dark:text-white text-center cursor-pointer opacity-75 hover:opacity-100"
			/>
		</div>
		<ViewerFromJson {json} height={150} />
		<Hr />

		<div class:hidden={!hasInfo} class="py-1">
			<PartInfo
				partId={component?.component?.device}
				partLinkVisible={false}
				kbVisible={true}
				bind:partInfo={hasInfo}
			/>
		</div>
	</Card>
</div>
