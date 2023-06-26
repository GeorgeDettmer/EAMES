<script lang="ts">
	import { page } from '$app/stores';
	import { createEventDispatcher } from 'svelte';
	import { XCircle, ChevronDown, ChevronUp } from 'svelte-heros-v2';
	import { Popover } from 'flowbite-svelte';
	import { stringToColorClass, classes, randomString } from '$lib/utils';

	import UserIcon from './UserIcon.svelte';
	import PartInfo from '$lib/components/PartInfo.svelte';
	import UserOverview from './UserOverview.svelte';
	import ActivityHistory from './ActivityHistory.svelte';

	export let item: Record<string, any>;
	export let color = item?.color || stringToColorClass(item?.part_id);

	const dispatch = createEventDispatcher();
	const listItemId = 'POP' + randomString();

	function onItemClick(e: MouseEvent, item) {
		dispatch('item_click', {
			event: e,
			step: item
		});
	}

	function onMouse(e: MouseEvent, item) {
		dispatch('item_mouse', {
			event: e,
			step: item
		});
	}

	$: complete = item?.signoffs?.length > 0;
	$: referenceStep = !!item?.part_id;
	$: borderColor = complete ? 'green-400' : 'red-600';
	$: bgColor = referenceStep ? color : borderColor;
	$: borderClasses = referenceStep ? `border-4` : 'border-4 border-dashed';
	$: bgOpacityClasses = referenceStep
		? 'bg-opacity-75 hover:bg-opacity-50'
		: 'bg-opacity-50 hover:bg-opacity-75';

	$: boardId = $page?.data?.boardId;
</script>

<div
	on:mouseenter={(e) => onMouse(e, item)}
	on:mouseleave={(e) => onMouse(e, item)}
	on:wheel|passive={(e) => onMouse(e, item)}
	on:click={(e) => onMouse(e, item)}
	on:mousedown={(e) => onMouse(e, item)}
	class="rounded-md w-full my-1 {bgOpacityClasses} bg-{bgColor} border-{borderColor} {borderClasses}"
>
	<div class="flex flex-row mx-1 my-2 items-center">
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div class="flex-none pr-2 cursor-pointer" on:click={(e) => onItemClick(e, item)}>
			{#if complete}
				<div class="p-1">
					{#each item?.signoffs as signoff (signoff?.id)}
						<div id={listItemId + signoff?.id}>
							<UserIcon user={signoff?.user} size="sm" />
						</div>
						<Popover
							style="z-index: 10000;"
							placement="left"
							triggeredBy={'#' + listItemId + signoff?.id}
							trigger="hover"
							class="w-96 text-sm font-light text-gray-500 bg-white dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800"
						>
							<UserOverview userId={signoff?.user?.id} />
							<ActivityHistory stepId={item?.id} {boardId} />
						</Popover>
					{/each}
				</div>
			{:else}
				<XCircle size="40" class="text-red-600" id={listItemId + item?.id} />
				<Popover
					style="z-index: 10000;"
					placement="left"
					triggeredBy={'#' + listItemId + item?.id}
					trigger="hover"
					class="w-96 text-sm font-light text-gray-500 bg-white dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800"
				>
					<ActivityHistory stepId={item?.id} {boardId} />
				</Popover>
			{/if}
		</div>
		<div class="flex-auto w-64">
			<div class="font-semibold text-xl">
				{#if item?.reference}
					{item.reference}
					{#if item?.part_id}
						<a id={listItemId} class={'float-right' + classes.link}>{item.part_id}</a>
						<Popover
							style="z-index: 10000;"
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
