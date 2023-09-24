<script lang="ts">
	import { Card, Hr } from 'flowbite-svelte';
	import ViewerFromJson from './ViewerFromJSON.svelte';
	import { createEventDispatcher } from 'svelte';
	import { classes } from '$lib/utils';
	import PartInfo from './PartInfo.svelte';
	import { XMark, ArrowTopRightOnSquare } from 'svelte-heros-v2';
	const dispatch = createEventDispatcher();
	export let json;
	export let component;
	export let kbId: string = '';
	export let dnf = false;
	let hasInfo: boolean = false;
</script>

<div class="w-full my-1">
	<Card size="xl">
		<div class="flex">
			<div class="py-1">
				<h5 class="text-2xl font-bold text-gray-900 dark:text-white">
					{component?.component?.component}
				</h5>
				{#if dnf}
					<p class="font-bold text-red-600">Not Fitted</p>
				{:else}
					<a
						target="_blank"
						href={`https://octopart.com/search?q=${component?.component?.device}&currency=GBP`}
						class={classes.link + 'font-bold'}>{component?.component?.device}</a
					>
				{/if}

				<p class="text-xs font-thin">{component?.component?.shape}</p>
			</div>
			<div class="float-right mx-auto mr-0">
				<XMark
					on:click={() => dispatch('back')}
					class="dark:text-white text-center cursor-pointer opacity-75 hover:opacity-100 mb-2 "
				/>
				<a href={window.origin + '/part/' + (component?.component?.device || '')} target="_blank">
					<ArrowTopRightOnSquare
						on:click={() => dispatch('back')}
						class="dark:text-white text-center cursor-pointer opacity-75 hover:opacity-100"
					/>
				</a>
			</div>
		</div>
		<ViewerFromJson {json} height={150} />
		<Hr />

		<div class:hidden={!hasInfo} class="py-0">
			<PartInfo partId={component?.component?.device} partLinkVisible={false} kbVisible={!!kbId} bind:partInfo={hasInfo} />
		</div>
	</Card>
</div>
