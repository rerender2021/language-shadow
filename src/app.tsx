import React, { useCallback, useEffect, useMemo } from "react";
import { AveRenderer, Grid, Window, getAppContext, IIconResource, IWindowComponentProps, Button } from "ave-react";
import { App, ThemePredefined_Dark } from "ave-ui";
import { PaddleOcrEngine } from "./ocr";
import { HelsinkiNlpEngine } from "./nlp";
import { containerLayout, controlLayout } from "./layout";
import { iconResource } from "./resource";
import { onMeasure, onTranslate } from "./shadow";

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
	const ocrEngine = useMemo(() => new PaddleOcrEngine({}), []);
	const nlpEngine = useMemo(() => new HelsinkiNlpEngine({}), []);
	const onClose = useCallback<IWindowComponentProps["onClose"]>(() => {
		ocrEngine.destroy();
		nlpEngine.destroy();
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
						<Button text="选择区域" iconInfo={{ name: "measure", size: 16 }} onClick={onMeasure}></Button>
					</Grid>
				</Grid>
			</Grid>
		</Window>
	);
}

AveRenderer.render(<LanguageShadow />);
