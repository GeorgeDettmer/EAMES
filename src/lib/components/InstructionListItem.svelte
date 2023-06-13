<script lang="ts">
	import { page } from '$app/stores';
	import { XCircle, ChevronDown, ChevronUp } from 'svelte-heros-v2';

	import { stringToColor } from '$lib/utils';
	import UserIcon from './UserIcon.svelte';

	export let item = {
		_id: 'item1',
		reference: 'J14',
		side: true,
		part: {
			mpn: '###MPN###'
		},
		detail: 'Note note note note note',
		signoff: {}
	};

	export let color = stringToColor(item?.part?.mpn);

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
		console.log($page.data?.user?.initials, 'ITEM HOVER: ', item, e);
	}
</script>

<div
	on:click={(e) => onItemClick(e, item)}
	on:mouseenter={(e) => onItemHover(e, item)}
	style="border-color: {color}; background-color: {color};"
	class="border-4 rounded-md w-full my-2 hover:bg-gray-500"
>
	<div class="flex flex-row mx-1 my-2 items-center">
		<div class="flex-none pr-2">
			{#if item?.signoff}
				<div class="pl-1"><UserIcon user={item?.signoff} size="sm" /></div>
			{:else}
				<XCircle size="40" class="text-red-600" />
			{/if}
		</div>
		<div class="flex-auto w-64">
			<span class="font-semibold">
				{item.reference}
				{item?.part?.mpn ? `(${item?.part?.mpn})` : ''}:
			</span>
			{item.detail}
		</div>
		<div class="flex-none pr-2">
			{#if item?.side}
				<ChevronDown />
			{:else}
				<ChevronUp />
			{/if}
		</div>
	</div>
</div>
