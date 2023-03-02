import { getAppContext } from "ave-react";
import { ImageContainerType, ImageData, ImageDimension, AveImage, PixFormat } from "ave-ui";
import { Region, screen, sleep } from "@nut-tree/nut-js";
import { shadowRelated } from ".";
import { IOcrEngine } from "../ocr/base";
import { INlpEngine } from "../nlp/base";

export const onTranslate = async function (ocrEngine: IOcrEngine, nlpEngine: INlpEngine) {
	try {
		if (shadowRelated.selectedAreaIsEmpty()) {
			throw { message: "skip, empty selected area" };
		}

		const region = new Region(shadowRelated.selectedArea.start.x, shadowRelated.selectedArea.start.y, shadowRelated.selectedArea.end.x - shadowRelated.selectedArea.start.x, shadowRelated.selectedArea.end.y - shadowRelated.selectedArea.start.y);
		const buffer = await getRegionBuffer(region);
		if (buffer) {
			const ocrStart = Date.now();
			const ocrResult = await ocrEngine.recognize(buffer);
			const ocrEnd = Date.now();
			console.log(`ocr end in ${ocrEnd - ocrStart}ms`);
			if (ocrResult.text !== shadowRelated.prevOcrText) {
				shadowRelated.prevOcrText = ocrResult.text;
				
				if (shadowRelated.prevOcrText !== "") {
					const translateStart = Date.now();
					const { text } = await nlpEngine.translate(shadowRelated.prevOcrText);
					shadowRelated.onUpdateTranslationResult(text);
					const translateEnd = Date.now();
					console.log(`translate end in ${translateEnd - translateStart}ms`);
				}
			}
		}
	} catch (error) {
		if (error?.message.startsWith("skip")) {
			// not important, continue to next translate
		} else {
			console.error(error);
		}
	} finally {
		await sleep(16);
		await onTranslate(ocrEngine, nlpEngine);
	}
};

async function getRegionBuffer(region: Region) {
	try {
		const start = Date.now();

		const regionGrabbed = await screen.grabRegion(region);
		const imageData = new ImageData();
		imageData.Format = PixFormat.B8G8R8A8_UNORM;
		imageData.Width = regionGrabbed.width;
		imageData.Height = regionGrabbed.height;
		imageData.Data = regionGrabbed.data.buffer;
		imageData.Depth = 1;
		imageData.RowPitch = regionGrabbed.width * 4;
		imageData.SlicePitch = imageData.RowPitch * imageData.Height;

		//
		const aveImage = new AveImage();
		aveImage.CreateFromImage(ImageDimension.Texture2D, imageData);

		//
		const context = getAppContext();
		const app = context.getAveApp();
		const codec = app.GetImageCodec();

		const ab = codec.SaveArrayBuffer(aveImage, ImageContainerType.PNG);
		const buffer = Buffer.from(ab);

		const end = Date.now();
		console.log(`get region buffer in ${end - start}ms`);
		return buffer;
	} catch (error) {
		console.error("get region buffer failed", error);
		return null;
	}
}
