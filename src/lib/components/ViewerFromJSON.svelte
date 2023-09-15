<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import Konva from 'konva';
	import type { Stage } from 'konva/lib/Stage';
	import type { Layer } from 'konva/lib/Layer';

	export let json;

	let viewer: HTMLDivElement;
	let stage: Stage;
	let layer: Layer;
	onMount(() => {
		stage = new Konva.Stage({
			container: viewer,
			width: window.innerWidth,
			height: 250,
			draggable: true
		});

		layer = new Konva.Layer();
		let group = Konva.Node.create(json, viewer);
		let scaleBy = 1.1;

		group.position({ x: 0, y: 0 });
		layer.add(group);
		stage.add(layer);
		stage.scaleY(-1);
		stage.scaleX(-1);
		console.log(group);
		group.findOne('.reference').remove();

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
	<div bind:this={viewer} class="overflow-hidden" />
</div>
