<script lang="ts">
	import InstructionListItem from './InstructionListItem.svelte';

	$: items = [
		{
			_id: 'item1',
			reference: 'J14',
			side: true,
			part: {
				mpn: '###MPN###'
			},
			detail: 'Note note note note note',
			signoff: ''
		},
		{
			_id: 'item2',
			reference: 'J15',
			side: false,
			part: {
				mpn: '61300211121'
			},
			detail: 'Note note note note note',
			signoff: {
				initials: 'GD',
				color: 'Blue'
			}
		}
	];
</script>

<div class=" p-1 w-2/3">
	{#each items as item}
		<InstructionListItem {item} />
	{/each}
</div>
