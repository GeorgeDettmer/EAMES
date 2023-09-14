<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import Konva from 'konva';

	export let json;

	let viewer: HTMLDivElement;
	let stage;
	let layer;
	onMount(() => {
		stage = Konva.Node.create(json, 'viewerjson');
		layer = new Konva.Layer();
		let scaleBy = 1.1;
		stage.on('wheel', (e) => {
			// stop default scrolling
			e.evt.preventDefault();

			let oldScale = stage.scaleX();
			let pointer = stage.getPointerPosition();

			let mousePointTo = {
				x: (pointer.x - stage.x()) / oldScale,
				y: (pointer.y - stage.y()) / oldScale
			};

			let direction = e.evt.deltaY > 0 ? 1 : -1;
			if (e.evt.ctrlKey) {
				direction = -direction;
			}

			let newScale = direction < 0 ? oldScale * scaleBy : oldScale / scaleBy;
			stage.scale({ x: newScale, y: newScale });

			let newPos = {
				x: pointer.x - mousePointTo.x * newScale,
				y: pointer.y - mousePointTo.y * newScale
			};
			stage.position(newPos);
		});
		return () => {
			stage.destroy();
		};
	});
</script>

<div>
	<div bind:this={viewer} class="overflow-hidden" id="viewerjson" />
</div>
