<script lang="ts">
	import ComponentDetail from '$lib/components/ComponentDetail.svelte';
	import List from '$lib/components/KnowledgeBase/List.svelte';

	export let data;
	$: partId = data?.partId;

	let kbInfo = false;
</script>

<div class="md:w-2/3 mx-auto">
	<div class="p-4 my-2 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-700 dark:border-gray-600 max-h-fit">
		<ComponentDetail
			galleryVisible={true}
			kbVisible={true}
			showPopoutButton={false}
			component={{ component: { device: partId } }}
			on:back={() => {
				window.close();
			}}
		/>
	</div>
</div>
