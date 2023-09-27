<script lang="ts">
	import { Card, Hr } from 'flowbite-svelte';
	import ViewerFromJson from './ViewerFromJSON.svelte';
	import { createEventDispatcher } from 'svelte';
	import { classes } from '$lib/utils';
	import PartInfo from './PartInfo.svelte';
	import { XMark, ArrowTopRightOnSquare } from 'svelte-heros-v2';
	const dispatch = createEventDispatcher();
	export let json = {};
	export let component;
	export let kbId: string = '';
	export let kbVisible: boolean = true;
	export let dnf = false;
	export let showPopoutButton = true;
	export let galleryVisible: boolean = false;
	let hasInfo: boolean = false;
	let footprint;
</script>

<div class="w-full my-1">
	<Card size="xl">
		<div class="flex">
			<div class="py-0.5">
				{#if component?.component?.component}
					<h5 class="text-2xl font-bold text-gray-900 dark:text-white">
						{component?.component?.component}
					</h5>
				{/if}

				{#if dnf}
					<p class="font-bold text-red-600">Not Fitted</p>
				{:else}
					<a
						target="_blank"
						href={`https://octopart.com/search?q=${component?.component?.device}&currency=GBP`}
						class={classes.link + 'font-bold'}
						class:text-2xl={!component?.component?.component}
					>
						{component?.component?.device}
					</a>
				{/if}
				{#if component?.component?.shape}
					<p class="text-xs font-thin">{component?.component?.shape}</p>
				{/if}
			</div>
			<div class="float-right mx-auto mr-0">
				<XMark
					on:click={() => dispatch('back')}
					class="dark:text-white text-center cursor-pointer opacity-75 hover:opacity-100 mb-2 "
				/>
				{#if showPopoutButton && hasInfo}
					<!-- <a href={window.origin + '/part/' + (component?.component?.device || '')} target="_blank">
						<ArrowTopRightOnSquare
							on:click={() => dispatch('back')}
							class="dark:text-white text-center cursor-pointer opacity-75 hover:opacity-100"
						/>
					</a> -->
				{/if}
			</div>
		</div>
		{#if Object.keys(json).length > 0}
			<ViewerFromJson {json} height={200} />
		{/if}

		{#if footprint}
			<ViewerFromJson json={footprint} height={200} />
		{/if}
		<Hr />

		<div class:hidden={!hasInfo} class="py-0">
			<PartInfo
				{showPopoutButton}
				partId={component?.component?.device}
				partLinkVisible={false}
				kbVisible={(!!kbId || hasInfo) && kbVisible}
				bind:hasInfo
				bind:footprint
				{galleryVisible}
			/>
		</div>
	</Card>
</div>
