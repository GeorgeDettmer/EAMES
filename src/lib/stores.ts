import { storage } from 'svelte-legos';
import { writable } from 'svelte/store';

export const scanStore = writable('');
export const openMenuGroupsStore = storage(writable([]), 'EAMES_navDrawerState');
export const windowTitleStore = writable('');
