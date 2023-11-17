import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Label, ScrollBar, AveRenderer, Grid, Window, getAppContext, IIconResource, IWindowComponentProps, Button, CheckBox, ICheckBoxComponentProps, IScrollBarComponentProps } from "ave-react";
import { App, ThemePredefined_Dark, CheckValue } from "ave-ui";
import { PaddleOcrEngine } from "./ocr";
import { HelsinkiNlpEngine } from "./nlp";
import { containerLayout, controlLayout } from "./layout";
import { iconResource } from "./resource";
import { onMeasure, onReset, onTranslate, safe, shadowRelated } from "./shadow";
import { getOcrConfig, getNlpConfig, NlpConfig } from "./config";
import axios from "axios";

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

	const [title, setTitle] = useState("Language Shadow");
	const [fontSize, setFontSize] = useState(14);
	const onSetFontSize = useCallback<IScrollBarComponentProps["onScrolling"]>((sender) => {
		const fontSize = sender.GetValue();
		shadowRelated.onUpdateFontSize(fontSize);
		setFontSize(fontSize);
	}, []);
	
	useEffect(() => {
		initTheme();
		ocrEngine.init();
		nlpEngine
			.init()
			.then(
				safe(async () => {
					const port = NlpConfig.nlpPort;
					const response = await axios.get(`http://localhost:${port}/gpu`);
					if (response.data.gpu === "True") {
						console.log("great! use gpu");
						setTitle("Language Shadow (GPU)");
					} else {
						console.log("gpu is not available");
					}
				})
			)
			.catch((error) => {
				console.error(error?.message);
			});
		onTranslate(ocrEngine, nlpEngine);
	}, []);

	return (
		<Window title={title} size={{ width: 260, height: 350 }} onInit={onInit} onClose={onClose}>
			<Grid style={{ layout: containerLayout }}>
				<Grid style={{ area: containerLayout.areas.control, layout: controlLayout }}>
					<Grid style={{ area: controlLayout.areas.measure }}>
						<Button text="选择识别区" iconInfo={{ name: "measure", size: 16 }} onClick={onMeasure}></Button>
					</Grid>
					<Grid style={{ area: controlLayout.areas.reset }}>
						<Button text="重置识别区" onClick={onReset}></Button>
					</Grid>
					<Grid style={{ area: controlLayout.areas.topmost }}>
						<CheckBox text="字幕置顶" value={CheckValue.Checked} onCheck={onSetTopMost}></CheckBox>
					</Grid>
					<Grid style={{ area: controlLayout.areas.fontSizeLabel }}>
						<Label text="字体大小"></Label>
					</Grid>
					<Grid style={{ area: controlLayout.areas.fontSize, margin: "10dpx 0 10dpx 0" }}>
						<ScrollBar min={10} max={50} value={14} /** default value */ onScrolling={onSetFontSize}></ScrollBar>
					</Grid>
					<Grid style={{ area: controlLayout.areas.fontSizeValue }}>
						<Label text={`${fontSize}`}></Label>
					</Grid>
				</Grid>
			</Grid>
		</Window>
	);
}

AveRenderer.render(<LanguageShadow />);
