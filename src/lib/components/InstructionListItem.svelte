<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { XCircle, ChevronDown, ChevronUp } from 'svelte-heros-v2';
	import { stringToColorClass, classes, randomString } from '$lib/utils';
	import { Popover, Hr } from 'flowbite-svelte';

	import UserIcon from './UserIcon.svelte';
	import PartInfo from '$lib/components/PartInfo.svelte';

	export let item: Object;
	export let color = item?.color || stringToColorClass(item?.part_id);

	const dispatch = createEventDispatcher();

	const listItemId = 'POP' + randomString();

	function onItemClick(e, item) {
		dispatch('item_click', {
			event: e,
			step: item
		});
	}

	$: complete = item?.signoffs?.length > 0;
	$: borderColor = complete ? 'green-400' : 'red-600';
</script>

<div
	class="border-4 rounded-md w-full my-1 bg-opacity-50 hover:bg-opacity-75 bg-{color} border-{borderColor}"
>
	<div class="flex flex-row mx-1 my-2 items-center">
		<div class={'flex-none pr-2 cursor-pointer'} on:click={(e) => onItemClick(e, item)}>
			{#if complete}
				<div class="p-1">
					{#each item?.signoffs as signoff (signoff?.id)}
						<UserIcon user={signoff?.user} size="sm" />
					{/each}
				</div>
			{:else}
				<XCircle size="40" class="text-red-600" />
			{/if}
		</div>
		<div class="flex-auto w-64">
			<div class="font-semibold text-xl">
				{#if item?.reference}
					{item.reference}
					{#if item?.part_id}
						<a id={listItemId} class={'float-right' + classes.link}>{item.part_id}</a>
						<Popover
							placement="left"
							triggeredBy={'#' + listItemId}
							trigger="hover"
							class="w-64 text-sm font-light text-gray-500 bg-white dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800"
						>
							<PartInfo partId={item.part_id} />
						</Popover>
						{#if item?.notes}
							<hr />
							<div class="text-sm italic">{item.notes}</div>
						{/if}
					{/if}
				{:else if item?.notes}
					<div class="text-base italic">{item.notes}</div>
				{/if}
			</div>
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
