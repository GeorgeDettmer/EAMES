<script>
	import classNames from 'classnames';
	export let progress = '45';
	export let size = 'h-4';
	export let labelInside = false;
	export let labelOutside = '';
	export let color = 'blue';
	export let labelInsideClass = `text-blue-100 text-xs ${'font-medium'} text-center leading-none rounded-full`;
	// let barColor: string;
	const barColors = {
		blue: 'bg-blue-600',
		gray: 'bg-gray-600 dark:bg-gray-300',
		red: 'bg-red-600 dark:bg-red-500',
		green: 'bg-green-400',
		yellow: 'bg-yellow-400',
		purple: 'bg-purple-600 dark:bg-purple-500',
		indigo: 'bg-indigo-600 dark:bg-indigo-500'
	};
</script>

{#if labelOutside}
	<div {...$$restProps} class={classNames('flex justify-between mb-1', $$props.class)}>
		<span class="text-base font-medium text-blue-700 dark:text-white">{labelOutside}</span>
		<span class="text-sm font-medium text-blue-700 dark:text-white">{progress}%</span>
	</div>
{/if}
<div class={classNames('w-full rounded-full', size, $$props.class)}>
	{#if labelInside}
		<div
			class={classNames(labelInsideClass, size, barColors[color])}
			class:hidden={!parseInt(progress)}
			style="width: {progress}%"
		>
			<p class={classNames(labelInsideClass, size, 'items-center')}>{progress}%</p>
		</div>
		{#if !parseInt(progress)}
			<p class={classNames(labelInsideClass, size, 'items-center')}>{progress}%</p>
		{/if}
	{:else}
		<div
			class={classNames(barColors[color], size, 'rounded-full')}
			class:hidden={!parseInt(progress)}
			style="width: {progress}%"
		/>
	{/if}
</div>
