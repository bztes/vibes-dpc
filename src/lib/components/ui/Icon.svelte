<script lang="ts" module>
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import Lock from '@lucide/svelte/icons/lock';
	import LogIn from '@lucide/svelte/icons/log-in';
	import Pencil from '@lucide/svelte/icons/pencil';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import Users from '@lucide/svelte/icons/users';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import CloudSnow from '@lucide/svelte/icons/cloud-snow';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import BrickWall from '@lucide/svelte/icons/brick-wall';
	import ChartArea from '@lucide/svelte/icons/chart-area';
	import ChartSpline from '@lucide/svelte/icons/chart-spline';
	import Check from '@lucide/svelte/icons/check';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Cloud from '@lucide/svelte/icons/cloud';
	import CloudSun from '@lucide/svelte/icons/cloud-sun';
	import Copy from '@lucide/svelte/icons/copy';
	import CopyPlus from '@lucide/svelte/icons/copy-plus';
	import Droplet from '@lucide/svelte/icons/droplet';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Gauge from '@lucide/svelte/icons/gauge';
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
	import Snowflake from '@lucide/svelte/icons/snowflake';
	import Sun from '@lucide/svelte/icons/sun';
	import Table2 from '@lucide/svelte/icons/table-2';
	import Tag from '@lucide/svelte/icons/tag';
	import Thermometer from '@lucide/svelte/icons/thermometer';
	import ThermometerSnowflake from '@lucide/svelte/icons/thermometer-snowflake';
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
		chevronRight: ChevronRight,
		grip: GripVertical,
		copy: Copy,
		more: Ellipsis,
		search: Search,
		save: Save,
		home: House,
		close: X,
		tag: Tag,
		settings: Settings,
		logout: LogOut,
		user: User,
		eye: Eye,
		eyeOff: EyeOff,
		sun: Sun,
		cloudSun: CloudSun,
		cloud: Cloud,
		cloudSnow: CloudSnow,
		snowflake: Snowflake,
		thermometerCold: ThermometerSnowflake,
		section: ChartArea,
		chart: ChartSpline,
		table: Table2,
		book: BookOpen,
		gauge: Gauge,
		wall: BrickWall,
		copyPlus: CopyPlus,
		back: ArrowLeft,
		key: KeyRound,
		dashboard: LayoutDashboard,
		lock: Lock,
		login: LogIn,
		edit: Pencil,
		shield: ShieldCheck,
		userPlus: UserPlus,
		users: Users,
		external: ExternalLink
	} as const;

	export type IconName = keyof typeof icons;
</script>

<script lang="ts">
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		name: IconName;
		size?: number;
		strokeWidth?: number;
		class?: ClassValue;
	}

	let { name, size = 16, strokeWidth = 2, class: className = '' }: Props = $props();

	let Component = $derived(icons[name]);
</script>

<Component {size} {strokeWidth} aria-hidden="true" class={['shrink-0', className]} />
