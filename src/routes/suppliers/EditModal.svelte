<script>
	import { enhance } from '$app/forms';
	import { Badge } from 'flowbite-svelte';
	import { PlusOutline } from 'flowbite-svelte-icons';

	export let editSupplier = {};

	let newIdentifierInput = '';
</script>

<div class="py-4">
	<form
		class="space-y-2"
		method="POST"
		action="/order?/updateSupplier"
		use:enhance
		on:submit|preventDefault={(e) => console.warn(e)}
	>
		<input type="hidden" name="order_item_id" bind:value={editSupplier.id} />

		<div>
			<label for="name" class="my-auto">Name</label>
			<input
				name="name"
				class="block w-24 text-md disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
				type="text"
				bind:value={editSupplier.name}
			/>
		</div>
		<div>
			<label for="names" class="my-auto">Identifiers</label>
			<div class="flex gap-x-0.5">
				{#each editSupplier?.names || [] as identifier}
					<div>
						<Badge
							color="blue"
							dismissable
							on:dismiss={() => {
								editSupplier.names = editSupplier.names.filter((v) => v !== identifier);
							}}>{identifier}</Badge
						>
					</div>
				{/each}
				<div class="flex my-auto">
					<input
						class="block w-24 text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-0.5"
						type="text"
						bind:value={newIdentifierInput}
					/>
					<button
						disabled={!newIdentifierInput || editSupplier?.names?.includes(newIdentifierInput)}
						on:click|preventDefault={() => {
							if (newIdentifierInput === '') return;
							editSupplier.names = [...editSupplier.names, newIdentifierInput];
							newIdentifierInput = '';
						}}
					>
						<PlusOutline size="xs" class="ml-0.5" />
					</button>
				</div>
			</div>
		</div>
		<div>
			<label for="risk_level" class="my-auto">Risk</label>
			<select
				name="name"
				class="block w-fit text-md disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
				bind:value={editSupplier.risk_level}
			>
				{#each ['LOW', 'MEDIUM', 'HIGH'] as level}
					<option value={level}>{level}</option>
				{/each}
			</select>
		</div>
		<div>
			<label for="tags" class="my-auto">Tags</label>
			<div class="flex gap-x-0.5">
				{#each editSupplier?.tags || [] as identifier}
					<div>
						<Badge
							color="blue"
							dismissable
							on:dismiss={() => {
								editSupplier.tags = editSupplier.tags.filter((v) => v !== identifier);
							}}
						>
							{identifier}
						</Badge>
					</div>
				{/each}
				<div class="flex my-auto">
					<input
						class="block w-24 text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-0.5"
						type="text"
						bind:value={newIdentifierInput}
					/>
					<button
						disabled={!newIdentifierInput || editSupplier?.tags?.includes(newIdentifierInput)}
						on:click|preventDefault={() => {
							if (newIdentifierInput === '') return;
							editSupplier.tags = [...editSupplier.tags, newIdentifierInput];
							newIdentifierInput = '';
						}}
					>
						<PlusOutline size="xs" class="ml-0.5" />
					</button>
				</div>
			</div>
		</div>
		<button
			class="ml-auto my-auto hover:text-red-600 disabled:text-inherit disabled:cursor-not-allowed disabled:opacity-50"
			on:click={() => {
				/* itemShipments = itemShipments.filter((v, i) => i?.shipment?.id !== selectedOis?.shipment?.id); */
			}}
		>
			<img
				style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(70deg)"
				width="24"
				height="24"
				src="https://img.icons8.com/ios/50/save--v1.png"
				alt="save"
			/>
		</button>
	</form>
</div>
