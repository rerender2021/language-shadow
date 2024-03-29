import { ISubtitle, safe, safeAsync, shadowRelated } from "./common";
import { WindowFramePart, DpiMargin, RichLabelBackColor, RichLabelTextColor, Rect, Byo2Font, AlignType, RichLabel as NativeRichLabel, IGridControl, DpiSize_2, DpiSize, CursorType, DockMode, Vec2, Vec4, Grid as NativeGrid, Window as NativeWindow, WindowFlag, WindowCreation, ImageContainerType, ImageData, ImageDimension, Byo2Image, AveImage, Picture as NativePicture, App, ThemePredefined_Dark, StretchMode, AveGetClipboard, CodeEditor as NativeEditor, ResourceSource, Byo2ImageCreation, Byo2ImageDataType, PixFormat } from "ave-ui";
import { emitSubtitleEvent } from "../server";

export const onDisplay = safeAsync(async function () {
	if (!shadowRelated.displayWindow) {
		console.log("display window not initialized, init it");
		const cp = new WindowCreation();
		cp.Flag |= WindowFlag.Layered;
		cp.Title = "Display";

		const width = shadowRelated.selectedArea.end.x - shadowRelated.selectedArea.start.x;
		const height = shadowRelated.selectedArea.end.y - shadowRelated.selectedArea.start.y;

		cp.Layout.Size = new Vec2(width || 300, height || 120);
		cp.Layout.Position = new Vec2(shadowRelated.selectedArea.start.x, shadowRelated.selectedArea.start.y);

		shadowRelated.displayWindow = new NativeWindow(cp);
	}

	if (!shadowRelated.displayWindow.IsWindowCreated()) {
		console.log("display window not created, create it");

		shadowRelated.displayWindow.OnCreateContent(
			safe(() => {
				console.log("display window create content callback");

				shadowRelated.displayWindow.SetBackground(false);
				shadowRelated.displayWindow.SetTopMost(shadowRelated.defaultTopMost);

				const frame = shadowRelated.displayWindow.GetFrame();
				frame.SetCaptionVisible(false);
				frame.OnNcHitTest(
					safe((sender, pos, part) => {
						if (part == WindowFramePart.Client) return WindowFramePart.Caption;
						return part;
					})
				);

				const container = new NativeGrid(shadowRelated.displayWindow);
				{
					const content = new NativeGrid(shadowRelated.displayWindow);
					const color = new Vec4(0, 0, 0, 255);
					content.SetBackColor(color);
					content.SetOpacity(0.5);
					container.ControlAdd(content).SetDock(DockMode.Fill);

					function createSubtitle() {
						const fd = shadowRelated.displayWindow.GetTheme().GetFont();
						fd.Size = 14;
						const fontDef = new Byo2Font(shadowRelated.displayWindow, fd);

						const textColor = new RichLabelTextColor();
						textColor.Text.Color = new Vec4(255, 255, 255, 255);

						const label = new NativeRichLabel(shadowRelated.displayWindow);
						label.FmSetDefaultFont(fontDef);
						label.FmSetDefaultTextColor(textColor);

						label.SetAlignHorz(AlignType.Near);
						label.SetAlignVert(AlignType.Center);
						return label;
					}

					// TODO: crash when use ""
					const en = createSubtitle();
					const zh = createSubtitle();
					en.SetText(" ");
					zh.SetText(" ");

					const subtitle = new NativeGrid(shadowRelated.displayWindow);
					subtitle.RowAddSlice(...[1]);
					subtitle.RowAddDpx(...[2]);
					subtitle.RowAddSlice(...[1]);
					subtitle.ColAddSlice(...[1]);

					const margin = new DpiMargin(
						DpiSize.FromPixelScaled(50), // margin left
						DpiSize.FromPixelScaled(5), // margin top
						DpiSize.FromPixelScaled(50), // margin right
						DpiSize.FromPixelScaled(5) // margin bottom
					);
					const enGrid = subtitle.ControlAdd(en).SetGrid(0, 0).SetMargin(margin);
					const zhGrid = subtitle.ControlAdd(zh).SetGrid(0, 2).SetMargin(margin);
					container.ControlAdd(subtitle).SetGrid(0, 0);

					//
					zhGrid.SetGrid(0, 0, 1, 3);
					en.SetOpacity(0);
					zh.SetOpacity(1);

					//
					shadowRelated.onUpdateFontSize = safe((size: number) => {
						const fd = shadowRelated.displayWindow.GetTheme().GetFont();
						fd.Size = size;
						const fontDef = new Byo2Font(shadowRelated.displayWindow, fd);

						en.FmSetDefaultFont(fontDef);
						zh.FmSetDefaultFont(fontDef);
						shadowRelated.displayWindow.Redraw();
					});

					//
					shadowRelated.onUpdateTranslationResult = safe((subtitle: ISubtitle) => {
						emitSubtitleEvent(subtitle);
						en.SetText(subtitle.en || " ");
						zh.SetText(subtitle.zh || " ");
						console.log("update subtitle", { subtitle });
						shadowRelated.displayWindow.Redraw();
					});
				}

				shadowRelated.displayWindow.SetSize(new Vec2(shadowRelated.selectedArea.end.x - shadowRelated.selectedArea.start.x, shadowRelated.selectedArea.end.y - shadowRelated.selectedArea.start.y));
				shadowRelated.displayWindow.SetPosition(new Vec2(shadowRelated.selectedArea.start.x, shadowRelated.selectedArea.start.y));
				shadowRelated.displayWindow.SetContent(container);

				console.log("display window set content");
				return true;
			})
		);

		const result = shadowRelated.displayWindow.CreateWindow(shadowRelated.measureWindow);
		console.log("display window create result", result);
	}

	if (shadowRelated.displayWindow.IsWindowCreated()) {
		console.log("display window reset pos");

		shadowRelated.displayWindow.SetSize(new Vec2(shadowRelated.selectedArea.end.x - shadowRelated.selectedArea.start.x, shadowRelated.selectedArea.end.y - shadowRelated.selectedArea.start.y));
		shadowRelated.displayWindow.SetPosition(new Vec2(shadowRelated.selectedArea.start.x, shadowRelated.selectedArea.start.y));

		console.log("display window created, activate it");

		shadowRelated.displayWindow.SetVisible(true);
		shadowRelated.displayWindow.Activate();

		console.log("activate display window done");
	}
});
