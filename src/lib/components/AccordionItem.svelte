<script>
  import { ChevronDown, ChevronUp } from "svelte-heros-v2";
  import classNames from "classnames";
  import { getContext, onMount } from "svelte";
  import { writable } from "svelte/store";
  import { fade, blur, fly, slide } from "svelte/transition";
  export let open = false;
  export let activeClasses = undefined;
  export let inactiveClasses = undefined;
  export let defaultClass = " justify-between w-full font-medium text-left";
  export let transitionType = "slide";
  export let transitionParams = {};
  // make a custom transition function that returns the desired transition
  const multiple = (node, params) => {
    switch (transitionType) {
      case "blur":
        return blur(node, params);
      case "fly":
        return fly(node, params);
      case "fade":
        return fade(node, params);
      default:
        return slide(node, params);
    }
  };
  const ctx = getContext("ctx") ?? {};
  // single selection
  const self = {};
  const selected = ctx.selected ?? writable();
  let _open = open;
  open = false;
  onMount(() => {
    if (_open) $selected = self;
    // this will trigger unsubscribe on destroy
    return selected.subscribe((x) => (open = x === self));
  });
  const handleToggle = (e) => selected.set(open ? {} : self);
  let buttonClass;
  $: buttonClass = classNames(
    defaultClass,
    ctx.flush ? "py-5" : "p-5",
    open && (ctx.flush ? "text-gray-900 dark:text-white" : activeClasses || ctx.activeClasses),
    !open && (ctx.flush ? "text-gray-500 dark:text-gray-400" : inactiveClasses || ctx.inactiveClasses),
    $$props.class
  );
</script>

<h2 aria-expanded={open} class="group">
  <button on:click={handleToggle} type="button" class={buttonClass}>
    <slot name="header" />
    {#if open}
      <slot name="arrowup"><ChevronUp /></slot>
    {:else}
      <slot name="arrowdown"><ChevronDown /></slot>
    {/if}
  </button>
</h2>
{#if open}
  <div transition:multiple|global={transitionParams}>
    <div class={ctx.flush ? "py-5" : "p-5"}>
      <slot />
    </div>
  </div>
{/if}
