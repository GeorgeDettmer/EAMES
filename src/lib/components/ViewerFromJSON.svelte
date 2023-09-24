<script lang="ts">
	import { onMount } from 'svelte';
	import Konva from 'konva';
	import type { Stage } from 'konva/lib/Stage';
	import type { Layer } from 'konva/lib/Layer';

	export let json;
	export let width: number = 500;
	export let height: number = 200;

	let viewer: HTMLDivElement;
	let stage: Stage;
	let layer: Layer;
	onMount(() => {
		stage = new Konva.Stage({
			container: viewer,
			width: width, //window.innerWidth,
			height: height,
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
		group.findOne('.reference')?.remove();
		group.find('.outline')?.forEach((o) => {
			o.strokeWidth(2);
			o.stroke('black');
		});

		let bb = group.getClientRect({ relativeTo: group });
		let groupMax = Math.max(group.getClientRect().width, group.getClientRect().height);
		let fontSize = Math.max(25, groupMax / 6);

		let group_dimensions = new Konva.Group({
			name: 'dimensions'
		});
		let bbRect = new Konva.Rect({
			width: bb.width,
			height: bb.height,
			x: bb.x,
			y: bb.y,
			stroke: 'gray',
			opacity: 0.75
		});
		group_dimensions.add(bbRect);
		let text_width = new Konva.Text({
			text: (Math.round((bb.width / 21.7) * 100) / 100).toString(),
			x: bb.x,
			y: bb.y,
			fill: 'gray',
			fontFamily: 'Calibri',
			fontSize: fontSize,
			scaleX: -1
		});
		text_width.position({
			y: bb.y + -text_width.height() - 10,
			x: bb.x + bb.width / 2 + text_width.width() / 2
		});
		let arrow_width = new Konva.Arrow({
			x: bb.x,
			y: bb.y - 10,
			points: [bb.width, 0, 0, 0],
			fill: 'gray',
			stroke: 'gray',
			strokeWidth: 2,
			pointerAtBeginning: true,
			pointerWidth: 10,
			pointerLength: 10
		});
		group_dimensions.add(text_width);
		group_dimensions.add(arrow_width);

		let text_height = new Konva.Text({
			text: (Math.round((bb.height / 21.7) * 100) / 100).toString(),
			x: bb.x,
			y: bb.y,
			rotation: 90,
			fill: 'gray',
			fontFamily: 'Calibri',
			fontSize: fontSize,
			scaleX: -1
		});
		text_height.position({
			y: bb.y + bb.height / 2 + text_height.width() / 2,
			x: bb.x - text_height.height() + 10
		});
		let arrow_height = new Konva.Arrow({
			x: bb.x - 10,
			y: bb.y,
			points: [0, 0, 0, bb.height],
			fill: 'gray',
			stroke: 'gray',
			strokeWidth: 2,
			pointerAtBeginning: true,
			pointerWidth: 10,
			pointerLength: 10
		});
		group_dimensions.add(text_height);
		group_dimensions.add(arrow_height);

		group.scaleX(-1);
		//group.position({ x: -stage.width() / 2, y: 250 / 2 });
		group.position({ x: stage.width() / 2 + bb.width, y: 0 });
		group.rotation(0);

		group.find('.pin_number').forEach((p) => p.visible(true));
		group.add(group_dimensions);
		const scale = Math.min(
			stage.width() / (group.getClientRect().width * 1.1),
			stage.height() / (group.getClientRect().height * 1.1)
		);
		stage.position({
			x: -group.getClientRect().x * scale,
			y: -group.getClientRect().y * scale
		});
		stage.scaleX(scale);
		stage.scaleY(scale);

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
			console.log('destroy: ViewerFromJSON');
			stage.destroy();
		};
	});
</script>

<div>
	<div bind:this={viewer} class="overflow-hidden w-full" />
</div>
