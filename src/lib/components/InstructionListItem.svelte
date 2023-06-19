<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { XCircle, ChevronDown, ChevronUp } from 'svelte-heros-v2';
	import { stringToColorClass } from '$lib/utils';
	import { Popover } from 'flowbite-svelte';

	import UserIcon from './UserIcon.svelte';

	export let item: Object;
	export let color = stringToColorClass(item?.part_id);

	const dispatch = createEventDispatcher();

	function onItemClick(e, item) {
		dispatch('item_click', {
			event: e,
			step: item
		});
	}
</script>

<div
	class="border-4 rounded-md w-full my-2 bg-opacity-50 hover:bg-opacity-75 bg-{color} border-{color}"
>
	<div class="flex flex-row mx-1 my-2 items-center">
		<div class="flex-none pr-2" on:click={(e) => onItemClick(e, item)}>
			{#if item?.signoffs?.length > 0}
				<div class="pl-1">
					{#each item?.signoffs as signoff, idx (signoff?.id)}
						<UserIcon user={signoff?.user} size="sm" />
					{/each}
				</div>
			{:else}
				<XCircle size="40" class="text-red-600" />
			{/if}
		</div>
		<div class="flex-auto w-64">
			<span class="font-semibold text-xl">
				{item.reference}
				{item?.part_id ? `(${item?.part_id})` : ''}
			</span>
			{item?.notes ? `: ${item.notes}` : ''}
		</div>
		<div class="flex-none pr-2">
			{#if item?.side === false}
				<ChevronDown />
			{:else if item?.side === true}
				<ChevronUp />
			{/if}
		</div>
	</div>
</div>
