<script lang="ts">
	export let job;
	export let expandable = true;
	export let open = false;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="p-4 bg-slate-300 text-slate-800 dark:bg-slate-800 dark:text-slate-300 m-1 rounded">
	<div
		on:click={() => {
			if (!expandable) return;
			open = !open;
		}}
		class:cursor-pointer={expandable}
		class:hover:shadow-lg={expandable}
		class="w-full font-medium inline-flex items-center justify-center"
	>
		<div class="mr-auto grid grid-cols-2 gap-x-2">
			<div>
				<p class="font-bold">{job?.customer?.name}</p>
			</div>
			<div>
				<p class="float-right">{job?.id}</p>
			</div>
			<div>
				<p>
					{job?.quantity}-off
				</p>
			</div>
			<div>
				{#if job?.batch}
					<p class="float-right">{job.batch}</p>
				{/if}
			</div>
		</div>
		<slot />
	</div>
	{#if open}
		<div class="pt-5 rounded bg-slate-400 dark:bg-slate-600">
			<p>Job info......</p>
			<div><a href={`${window.origin}/assembly/${job?.assembly?.id}`} target="_blank">{job?.assembly?.name}</a></div>
			<div>
				<a href={`${window.origin}/bom/${job?.assembly?.bom?.id}?jobId=${job?.id}`} target="_blank">
					BOM ({job?.assembly?.bom?.lines_aggregate?.aggregate?.count} lines)
				</a>
			</div>
		</div>
	{/if}
</div>
