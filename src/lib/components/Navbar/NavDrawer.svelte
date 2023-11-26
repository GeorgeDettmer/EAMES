<script lang="ts">
	import {
		Drawer,
		Button,
		CloseButton,
		Sidebar,
		SidebarBrand,
		SidebarCta,
		SidebarDropdownItem,
		SidebarDropdownWrapper,
		SidebarGroup,
		SidebarItem,
		SidebarWrapper,
		Hr,
		Input
	} from 'flowbite-svelte';
	import { ChartPieSolid, SearchOutline } from 'flowbite-svelte-icons';
	import { sineIn } from 'svelte/easing';
	import type { Writable } from 'svelte/store';
	export let hidden = true;
	export let search: string | undefined = undefined;
	let spanClass = 'flex-1 ml-3 whitespace-nowrap';
	let transitionParams = {
		x: -320,
		duration: 200,
		easing: sineIn
	};

	export let menus = [];
	export let openMenuGroups: Writable<string[]>;

	function onItemClick(e, item) {
		if (item?.href) {
			hidden = true;
		}
	}

	let searchInput: HTMLInputElement;

	$: {
		if (search !== undefined) {
			searchInput?.focus();
		}
	}
</script>

<svelte:window
	on:keydown={(e) => {
		/* if (e.key === 'Escape' && !hidden && !searchInput) {
			hidden = true;
		} */
	}}
/>

<Drawer transitionType="fly" {transitionParams} bind:hidden id="sidebar2">
	<div class="flex items-center">
		{#if search === undefined}
			<SearchOutline
				on:click={() => (search = '')}
				class="w-6 h-6 cursor-pointer text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
			/>
		{:else}
			<input
				class="block w-full disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
				bind:this={searchInput}
				bind:value={search}
				on:keydown={(e) => {
					if (e.key === 'Escape') {
						search = undefined;
					}
				}}
				on:focusout={() => {
					if (search == '') {
						search = undefined;
					}
				}}
			/>
		{/if}
		<div class="ml-4"><CloseButton on:click={() => (hidden = true)} class="ml-6 mb-4 dark:text-white" /></div>
	</div>
	<Sidebar>
		<SidebarWrapper divClass="overflow-y-auto py-4 px-3 rounded dark:bg-gray-800">
			<SidebarGroup>
				<SidebarItem label="My Dashboard" {spanClass}>
					<svelte:fragment slot="icon">
						<ChartPieSolid
							class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
						/>
					</svelte:fragment>
					<svelte:fragment slot="subtext">
						<span
							class="bg-orange-500 inline-flex justify-center items-center p-3 ml-3 w-3 h-3 text-sm font-medium text-primary-600 bg-primary-200 rounded-full dark:bg-primary-900 dark:text-primary-200"
						>
							3
						</span>
					</svelte:fragment>
				</SidebarItem>
			</SidebarGroup>
			{#each Object.entries(menus) as [group, items]}
				<div class="py-2 capitalize">
					<Hr>{group}</Hr>
				</div>
				<SidebarGroup>
					{#each items as item}
						{#if item?.items}
							{@const key = `${group}-${item.name}`.toLowerCase()}
							{#if search === undefined}
								<div
									on:click={() => {
										console.log('openMenuGroups click', key, ...$openMenuGroups);
										if ($openMenuGroups.includes(key)) {
											$openMenuGroups = $openMenuGroups.filter((g) => g !== key);
										} else {
											$openMenuGroups = [...$openMenuGroups, key];
										}
									}}
								>
									<SidebarDropdownWrapper label={item.name} isOpen={$openMenuGroups.includes(key)}>
										<svelte:fragment slot="icon">
											{#if item?.icon}
												<svelte:component this={item.icon} />
											{/if}
										</svelte:fragment>
										{#each item.items as subitem}
											<SidebarDropdownItem
												href={subitem?.href}
												label={subitem.name}
												on:click={(e) => {
													onItemClick(e, subitem);
												}}
											/>
										{/each}
									</SidebarDropdownWrapper>
								</div>
							{:else}
								{#each item.items as subitem}
									{#if search && subitem.name.toLowerCase().includes(search.toLowerCase())}
										<SidebarItem
											href={subitem?.href}
											label={item.name + ' | ' + subitem.name}
											on:click={(e) => {
												onItemClick(e, subitem);
											}}
										/>
									{/if}
								{/each}
							{/if}
						{:else if search !== undefined && search && item.name.toLowerCase().includes(search.toLowerCase())}
							<SidebarItem
								href={item?.href}
								label={item.name}
								{spanClass}
								on:click={(e) => {
									onItemClick(e, item);
								}}
							>
								<svelte:fragment slot="icon">
									{#if item?.icon}
										<svelte:component this={item.icon} />
									{/if}
								</svelte:fragment>
							</SidebarItem>
						{:else}
							<SidebarItem
								href={item?.href}
								label={item.name}
								{spanClass}
								on:click={(e) => {
									onItemClick(e, item);
								}}
							>
								<svelte:fragment slot="icon">
									{#if item?.icon}
										<svelte:component this={item.icon} />
									{/if}
								</svelte:fragment>
							</SidebarItem>
						{/if}
					{/each}
				</SidebarGroup>
			{:else}
				<p>No menu items configured...</p>
			{/each}
		</SidebarWrapper>
	</Sidebar>
</Drawer>
