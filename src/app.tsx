import React, { useCallback, useEffect, useMemo } from "react";
import { AveRenderer, Grid, Window, getAppContext, IIconResource, IWindowComponentProps, Button, CheckBox, ICheckBoxComponentProps } from "ave-react";
import { App, ThemePredefined_Dark, CheckValue } from "ave-ui";
import { PaddleOcrEngine } from "./ocr";
import { HelsinkiNlpEngine } from "./nlp";
import { containerLayout, controlLayout } from "./layout";
import { iconResource } from "./resource";
import { onMeasure, onReset, onTranslate, shadowRelated } from "./shadow";
import { getOcrConfig, getNlpConfig } from "./config";

function onInit(app: App) {
	const context = getAppContext();
	context.setIconResource(iconResource as unknown as IIconResource);
}

function initTheme() {
	const context = getAppContext();
	const themeImage = context.getThemeImage();
	const themeDark = new ThemePredefined_Dark();
	themeDark.SetStyle(themeImage, 0);
}

export function LanguageShadow() {
	const ocrEngine = useMemo(
		() =>
			new PaddleOcrEngine({
				...getOcrConfig(),
			}),
		[]
	);
	const nlpEngine = useMemo(
		() =>
			new HelsinkiNlpEngine({
				...getNlpConfig(),
			}),
		[]
	);
	const onClose = useCallback<IWindowComponentProps["onClose"]>(() => {
		ocrEngine.destroy();
		nlpEngine.destroy();
	}, []);

	const onSetTopMost = useCallback<ICheckBoxComponentProps["onCheck"]>((sender) => {
		let shouldTopMost = true;

		const checkValue = sender.GetValue();
		if (checkValue === CheckValue.Unchecked) {
			shouldTopMost = false;
		} else if (checkValue === CheckValue.Checked) {
			shouldTopMost = true;
		}

		shadowRelated.displayWindow?.SetTopMost(shouldTopMost);
		if (!shadowRelated.displayWindow) {
			shadowRelated.defaultTopMost = shouldTopMost;
		}
	}, []);

	useEffect(() => {
		initTheme();
		ocrEngine.init();
		nlpEngine.init();
		onTranslate(ocrEngine, nlpEngine);
	}, []);

	return (
		<Window title="Language Shadow" size={{ width: 260, height: 350 }} onInit={onInit} onClose={onClose}>
			<Grid style={{ layout: containerLayout }}>
				<Grid style={{ area: containerLayout.areas.control, layout: controlLayout }}>
					<Grid style={{ area: controlLayout.areas.measure }}>
						<Button text="???????????????" iconInfo={{ name: "measure", size: 16 }} onClick={onMeasure}></Button>
					</Grid>
					<Grid style={{ area: controlLayout.areas.reset }}>
						<Button text="???????????????" onClick={onReset}></Button>
					</Grid>
					<Grid style={{ area: controlLayout.areas.topmost }}>
						<CheckBox text="????????????" value={CheckValue.Checked} onCheck={onSetTopMost}></CheckBox>
					</Grid>
				</Grid>
			</Grid>
		</Window>
	);
}

AveRenderer.render(<LanguageShadow />);
