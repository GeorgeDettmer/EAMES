<script>
	import '../app.postcss';
	import { fade } from 'svelte/transition';
	import NavMain from './components/NavMain.svelte';
</script>

<NavMain />
<main class="h-screen overflow-y-scroll">
	<div class="mx-auto max-w-8xl py-16 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<div class="rounded-lg border-4 border-dashed border-grey-400">
				<div in:fade={{ duration: 500 }}>
					<slot />
				</div>
			</div>
		</div>
	</div>
</main>
