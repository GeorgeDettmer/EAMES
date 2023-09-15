<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import Konva from 'konva';
	import type { Stage } from 'konva/lib/Stage';
	import type { Layer } from 'konva/lib/Layer';
	import { text } from 'svelte/internal';

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

		layer.add(group);
		stage.add(layer);
		//stage.scaleY(-1);
		//stage.scaleX(1);
		console.log(group);
		group.findOne('.reference').remove();

		let bb = group.getClientRect({ relativeTo: group });
		let bbRect = new Konva.Rect({
			width: bb.width,
			height: bb.height,
			x: bb.x,
			y: bb.y,
			stroke: 'gray',
			opacity: 0.25
		});
		group.add(bbRect);

		let group_dimensions = new Konva.Group({
			name: 'dimensions'
		});
		let text_width = new Konva.Text({
			text: (Math.round((bb.width / 21.7) * 100) / 100).toString(),
			x: bb.x,
			y: bb.y,
			stroke: 'black',
			fontFamily: 'Calibri',
			fontSize: 25,
			scaleX: -1,
			opacity: 0.5
		});
		text_width.position({
			y: bb.y + -text_width.height() - 10,
			x: bb.x + bb.width / 2 + text_width.width() / 2
		});
		let arrow_width = new Konva.Arrow({
			x: bb.x,
			y: bb.y - 10,
			points: [bb.width, 0, 0, 0],
			fill: 'black',
			stroke: 'black',
			strokeWidth: 2,
			pointerAtBeginning: true,
			pointerWidth: 10,
			pointerLength: 10,
			opacity: 0.5
		});
		group_dimensions.add(text_width);
		group_dimensions.add(arrow_width);

		let text_height = new Konva.Text({
			text: (Math.round((bb.height / 21.7) * 100) / 100).toString(),
			x: bb.x,
			y: bb.y,
			rotation: 90,
			stroke: 'black',
			fontFamily: 'Calibri',
			fontSize: 25,
			scaleX: -1,
			opacity: 0.5
		});
		text_height.position({
			y: bb.y + bb.height / 2 + text_height.width() / 2,
			x: bb.x - text_height.height() + 10
		});
		let arrow_height = new Konva.Arrow({
			x: bb.x - 10,
			y: bb.y,
			points: [0, 0, 0, bb.height],
			fill: 'black',
			stroke: 'black',
			strokeWidth: 2,
			pointerAtBeginning: true,
			pointerWidth: 10,
			pointerLength: 10,
			opacity: 0.5
		});
		group_dimensions.add(text_height);
		group_dimensions.add(arrow_height);

		group.scaleX(-1);
		//group.position({ x: -stage.width() / 2, y: 250 / 2 });
		group.position({ x: layer.width() / 2 + bb.width, y: 0 });
		group.rotation(0);

		group.find('.pin_number').forEach((p) => p.visible(true));

		group.add(group_dimensions);
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
