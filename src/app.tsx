import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Label, ScrollBar, AveRenderer, Grid, Window, getAppContext, IIconResource, IWindowComponentProps, Button, CheckBox, ICheckBoxComponentProps, IScrollBarComponentProps, Hyperlink } from "ave-react";
import { App, ThemePredefined_Dark, CheckValue } from "ave-ui";
import { PaddleOcrEngine } from "./ocr";
import { HelsinkiNlpEngine } from "./nlp";
import { containerLayout, controlLayout } from "./layout";
import { iconResource } from "./resource";
import { onMeasure, onReset, onTranslate, safeAsync, shadowRelated } from "./shadow";
import { getOcrConfig, getNlpConfig, NlpConfig, getWebUiConfig } from "./config";
import axios from "axios";
import { emitFlushEvent, isInitError, shutdown, startLanguageShadowWebUI } from "./server";
import { assetsPath, runtimeAssetsPath } from "./common";

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

		emitFlushEvent();
		shutdown();
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

	const defaultHomeIconPath = assetsPath("snow.png");
	const defaultHomeRotateIconPath = assetsPath("snow-rotate.png");
	const customHomeIconPath = runtimeAssetsPath("./web-ui.png");
	const customHomeRotateIconPath = runtimeAssetsPath("./web-ui-hover.png");
	console.log("icon path", {
		customHomeIconPath,
		customHomeRotateIconPath
	});
	const [imgSrc, setImgSrc] = useState(customHomeIconPath ?? defaultHomeIconPath);
	const onEnterImage = () => {
		setImgSrc(customHomeRotateIconPath ?? defaultHomeRotateIconPath);
	};
	const onLeaveImage = () => {
		setImgSrc(customHomeIconPath ?? defaultHomeIconPath);
	};

	const [ocrReady, setOcrReady] = useState(false);
	const [nlpReady, setNlpReady] = useState(false);

	const [ocrError, setOcrError] = useState(false);
	const [nlpError, setNlpError] = useState(false);
	
	const gotoWebUi = () => {
		//  https://stackoverflow.com/a/49013356
		const url = webUiLink;
		const start = "start";
		require("child_process").exec(start + " " + url);
	};

	useEffect(() => {
		initTheme();
		ocrEngine
			.init()
			.then(() => {
				setOcrReady(true);
				setOcrError(isInitError());
				console.log("ocr init done");
			})
			.catch((error) => {
				setOcrReady(false);
				setOcrError(true);
				console.log("ocr init failed");
				console.error(error?.message);
			});
		nlpEngine
			.init()
			.then(() => {
				setNlpReady(true);
				setNlpError(isInitError());
				console.log("nlp init done");

				const port = NlpConfig.nlpPort;
				axios
					.get(`http://localhost:${port}/gpu`)
					.then((response) => {
						if (response.data.gpu === "True") {
							console.log("great! use gpu");
							setTitle("Language Shadow (GPU)");
						} else {
							console.log("gpu is not available");
						}
					})
					.catch((e) => {
						console.log("gpu is not available");
					});
			})
			.catch((error) => {
				setNlpReady(false);
				setNlpError(true);
				console.log("nlp init failed");
				console.error(error?.message);
			});
		onTranslate(ocrEngine, nlpEngine);
	}, []);

	const isReady = nlpReady && ocrReady;
	const isError = nlpError || ocrError;
	const webUiLink = `http://localhost:${getWebUiConfig().port}`;

	return (
		<Window title={title} size={{ width: 260, height: 350 }} onInit={onInit} onClose={onClose}>
			<Grid style={{ layout: containerLayout }}>
				<Grid style={{ area: containerLayout.areas.control, layout: controlLayout }}>
					{isReady && !isError ? (
						<>
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
							<Grid style={{ area: controlLayout.areas.snow }}>
								<Image src={imgSrc} onPointerPress={gotoWebUi} onPointerEnter={onEnterImage} onPointerLeave={onLeaveImage} />
							</Grid>
						</>
					) : isError ? (
						<Grid style={{ area: controlLayout.areas.measure }}>
							<Hyperlink text={`初始化失败, 查看问题: <${webUiLink}/>`} onClick={gotoWebUi} />
						</Grid>
					) : (
						<Grid style={{ area: controlLayout.areas.measure }}>
							<Label text="初始化中..."></Label>
						</Grid>
					)}
				</Grid>
			</Grid>
		</Window>
	);
}

AveRenderer.render(<LanguageShadow />);

startLanguageShadowWebUI();
