import { getAppContext } from "ave-react";
import { IGridControl, Vec2, Grid as NativeGrid, Window as NativeWindow } from "ave-ui";

export type ShadowRelatedType = {
	prevOcrText: string;
	measureWindow: NativeWindow;
	selected: IGridControl<NativeGrid>;
	start: Vec2;
	end: Vec2;
	current: Vec2;
	selectedArea: {
		start: Vec2;
		end: Vec2;
	};
	displayWindow: NativeWindow;
	defaultTopMost: boolean;
	selectedAreaIsEmpty(): boolean;
	onUpdateTranslationResult: (text: ISubtitle) => void;
};

export const shadowRelated: ShadowRelatedType = {
	prevOcrText: "",
	measureWindow: null,
	selected: null,
	start: null,
	end: null,
	current: null,
	selectedArea: {
		start: new Vec2(0, 0),
		end: new Vec2(0, 0),
	},
	displayWindow: null,
	defaultTopMost: true,
	selectedAreaIsEmpty(this: ShadowRelatedType) {
		return this.selectedArea.start.x === 0 && this.selectedArea.start.y === 0 && this.selectedArea.end.x === 0 && this.selectedArea.end.x === 0;
	},
	onUpdateTranslationResult: () => {},
};

globalThis.shadowRelated = shadowRelated;

export function safe(callback: Function) {
	return (...args: any[]) => {
		try {
			return callback(...args);
		} catch (error) {
			console.error(error);
		}
	};
}

export function getPrimaryMonitor() {
	const context = getAppContext();
	const window = context.getWindow();
	const platform = window.GetPlatform();
	const monitors = platform.MonitorEnumerate();
	const primary = monitors.find((each) => each.Primary);
	return primary;
}

export interface ISubtitle {
	zh: string;
	en: string;
}