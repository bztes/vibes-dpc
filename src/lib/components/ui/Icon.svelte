<script lang="ts" module>
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Check from '@lucide/svelte/icons/check';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Copy from '@lucide/svelte/icons/copy';
	import Droplet from '@lucide/svelte/icons/droplet';
	import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import House from '@lucide/svelte/icons/house';
	import Info from '@lucide/svelte/icons/info';
	import Layers from '@lucide/svelte/icons/layers';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Plus from '@lucide/svelte/icons/plus';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Save from '@lucide/svelte/icons/save';
	import Search from '@lucide/svelte/icons/search';
	import Settings from '@lucide/svelte/icons/settings';
	import SlidersVertical from '@lucide/svelte/icons/sliders-vertical';
	import Tag from '@lucide/svelte/icons/tag';
	import Thermometer from '@lucide/svelte/icons/thermometer';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import User from '@lucide/svelte/icons/user';
	import Wind from '@lucide/svelte/icons/wind';
	import X from '@lucide/svelte/icons/x';

	/** Lucide icons by the names used in this app */
	const icons = {
		plus: Plus,
		trash: Trash2,
		up: ArrowUp,
		down: ArrowDown,
		check: Check,
		alert: TriangleAlert,
		drop: Droplet,
		info: Info,
		sliders: SlidersVertical,
		reset: RotateCcw,
		thermometer: Thermometer,
		wind: Wind,
		layers: Layers,
		chevron: ChevronDown,
		grip: GripVertical,
		copy: Copy,
		more: EllipsisVertical,
		search: Search,
		save: Save,
		arrow: ArrowRight,
		home: House,
		close: X,
		tag: Tag,
		settings: Settings,
		logout: LogOut,
		user: User
	} as const;

	export type IconName = keyof typeof icons;
</script>

<script lang="ts">
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		name: IconName;
		size?: number;
		class?: ClassValue;
	}

	let { name, size = 16, class: className = '' }: Props = $props();

	let Component = $derived(icons[name]);
</script>

<Component {size} aria-hidden="true" class={['shrink-0', className]} />
