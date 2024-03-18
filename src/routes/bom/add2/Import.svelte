<script lang="ts">
	import { filedrop, type FileDropOptions } from 'filedrop-svelte';
	import FileDrop from 'filedrop-svelte/components/FileDrop';

	export let options: FileDropOptions = {
		windowDrop: false,
		clickToUpload: false
	};
	let files: File[] = [];
	async function handleDrop(e) {
		files = e.detail.files;
		console.log('fileDrop:', files);
	}
</script>

{#if options.windowDrop}
	<div use:filedrop={options} on:filedrop={handleDrop} />
{:else}
	<FileDrop on:filedrop={handleDrop}>
		{#if $$slots.default}
			<slot />
		{:else}
			<div class="flex bg-slate-500 h-20">
				<p>Drag & drop file here</p>
			</div>
		{/if}
	</FileDrop>
{/if}
