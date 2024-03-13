<script lang="ts">
	import { Tooltip } from 'flowbite-svelte';
	import { createEventDispatcher } from 'svelte';
	import { normalize, expand } from 'ranges-set';
	export let pn;
	export let references: string[] = [];
	export let color: string = '';
	export let conoslidate: boolean = false;
	export let maxHeight: string = 'max-h-[100px]';

	$: refs = conoslidate ? conoslidateReferences(references).flat() : references;
	//$: console.log('REFS:', refs);

	const dispatch = createEventDispatcher();

	/* function conoslidateReferences(input: Array<string>): Array<string> {
		let prefixes: Map<string, Array<string>> = new Map();

		input.map((ref) => {
			let regex = ref.match(/(?<PREFIX>(\D)*)(?<NUMBER>(\d)*)/);
			let prefix = regex?.groups?.PREFIX;
			let number = regex?.groups?.NUMBER;

			if (!prefix || !number) return ref;
			if (!prefixes.has(prefix)) {
				prefixes.set(prefix, []);
			}
			prefixes.get(prefix)?.push(number);
		});

		let references: Array<string> = [...prefixes.entries()].map(([prefix, numbers], idx) => {
			let refs = normalize(numbers.join(','))
				.split(',')
				.map((n) => prefix + n);
			//console.log('refs', refs);
			return refs;
		});

		//console.log(input, prefixes, references);

		return references;
	} */

	function conoslidateReferences(input: Array<string>): Array<string> {
		let fixes: Map<string, Array<string>> = new Map();

		input.map((ref) => {
			if (ref) {
				let regex = ref.match(/(?<PREFIX>([A-Za-z]+)*)(?<NUMBER>(\d)*)(?<SUFFIX>(.+)*)/);
				let prefix = regex?.groups?.PREFIX;
				let suffix = regex?.groups?.SUFFIX;
				let number = regex?.groups?.NUMBER;
				let fix = prefix + '|' + suffix;
				if (!fix || !number) return ref;
				if (!fixes.has(fix)) {
					fixes.set(fix, []);
				}
				fixes.get(fix)?.push(number);
			}
		});

		let references: Array<string> = [...fixes.entries()].map(([fix, numbers], idx) => {
			let p = fix.split('|')?.[0] || '';
			let s = fix.split('|')?.[1] || '';
			let refs = normalize(numbers.join(','))
				.split(',')
				.map((n) => p + n + s);
			//console.log('refs', refs);
			return refs;
		});

		//console.log(input, prefixes, references);

		return references;
	}
</script>

<!-- <TableBodyCell tdClass="overflow-x-auto overflow-y-auto"> -->
<!-- <div class="w-fit overflow-auto grid grid-flow-row text-xs xl:grid-cols-8 lg:grid-cols-6 md:grid-cols-2">
	{#each references as reference}
		{@const colour = pn ? 'blue' : 'gray'}
		<span
			class={`hover:shadow m-0.5 h-4  rounded font-medium px-1 bg-${colour}-100 text-${colour}-800 dark:bg-${colour}-900 dark:text-${colour}-300`}
			on:mouseenter={(e) => {
				dispatch('mouseenter', e);
			}}
			on:mouseleave={(e) => {
				dispatch('mouseleave', e);
			}}
		>
			<p class="overflow-hidden text-clip hover:-text-clip text-center">{reference}</p>
		</span>
		<Tooltip defaultClass="py-1 px-2 text-xs font-medium">{reference}</Tooltip>
	{/each}
</div> -->
<div
	class="w-fit flex flex-wrap text-xs {maxHeight} overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-400 dark:scrollbar-thumb-gray-400 dark:scrollbar-track-gray-700"
>
	{#each refs as reference}
		{@const c = color ? color : pn ? 'blue' : 'gray'}
		{#if reference}
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<span
				class={`w-fit hover:shadow m-0.5 h-4  rounded font-medium px-1 bg-${c}-100 text-${c}-800 dark:bg-${c}-900 dark:text-${c}-300`}
				on:mouseenter={(e) => {
					dispatch('mouseenter', e);
				}}
				on:mouseleave={(e) => {
					dispatch('mouseleave', e);
				}}
			>
				<p class="text-clip hover:-text-clip text-center">{reference}</p>
			</span>
			<!-- <Tooltip defaultClass="py-1 px-2 text-xs font-medium ">{expand(reference)}</Tooltip> -->
		{/if}
	{/each}
</div>
<!-- </TableBodyCell> -->
