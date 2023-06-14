<script lang="ts">
	import { page } from '$app/stores';
	import { XCircle, CheckCircle, ChevronDown, ChevronUp } from 'svelte-heros-v2';

	import { stringToColor, stringToColorClass } from '$lib/utils';
	import UserIcon from './UserIcon.svelte';

	export let item: Object;

	export let color = stringToColorClass(item?.part_id);
	$: console.log(color);
	function onItemClick(e, item) {
		console.log($page.data?.user?.initials, 'ITEM CLICK: ', item, e);
		if (!$page.data.user.initials) return;
		if (!item.signoff) {
			item.signoff = {
				initials: $page.data.user.initials
			};
		} else {
			item.signoff = undefined;
		}
	}

	function onItemHover(e, item) {
		//console.log($page.data?.user?.initials, 'ITEM HOVER: ', item, e);
	}
</script>

<div
	on:click={(e) => onItemClick(e, item)}
	on:mouseenter={(e) => onItemHover(e, item)}
	class="border-4 rounded-md w-full my-2 bg-opacity-50 hover:bg-opacity-75 bg-{color} border-{color}"
>
	<div class="flex flex-row mx-1 my-2 items-center">
		<div class="flex-none pr-2">
			{#if item?.signoffs?.length > 0}
				<div class="pl-1">
					{#each item?.signoffs as signoff}
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
