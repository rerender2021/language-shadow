import axios from "axios";
import path from "path";
import fs from "fs";
import childProcess from "child_process";
import { IOcrEngine, IOcrEngineOptions, IOcrResult } from "./base";

export interface IPaddleOcrResult extends IOcrResult {
	detail: Array<IPaddleOcrItem>;
}

// prettier-ignore
export type IPaddleOcrItem = [
    [
        [number, number], 
        [number, number], 
        [number, number], 
        [number, number]
    ],
    [string, number]
];

export class PaddleOcrEngine implements IOcrEngine {
	private options: IOcrEngineOptions;
	private ocr: childProcess.ChildProcessWithoutNullStreams;

	constructor(options: IOcrEngineOptions) {
		this.options = options;
	}

	async init() {
		console.log("try to init paddle ocr engine");
		const paddleDir = path.resolve(process.cwd(), "ocr-server");
		const exePath = path.resolve(paddleDir, "./PaddleocrAPI.exe");
		if (fs.existsSync(paddleDir) && fs.existsSync(exePath)) {
			return new Promise((resolve, reject) => {
				console.log("paddleDir exists, start ocr server", paddleDir);

				const ocr = childProcess.spawn(`./ocr-server/PaddleocrAPI.exe`, [`--lang=en`, `--model-dir=.\\model`], { windowsHide: true, detached: false /** hide console */ });
				this.ocr = ocr;
				ocr.stdout.on("data", (data) => {
					console.log(`stdout: ${data}`);
					if (data.includes("PaddleocrAPI has been started")) {
						console.log("ocr server started");
						resolve(true);
					}
				});

				ocr.stderr.on("data", (data) => {
					console.error(`stderr: ${data}`);
				});

				ocr.on("close", (code) => {
					console.log(`ocr server exit: ${code}`);
					reject(false);
				});
			});
		} else {
			console.log("paddle ocr server not exist");
		}
	}

	async destroy() {
		if (this.ocr) {
			console.log("exit ocr server process");
			process.kill(this.ocr?.pid);
			process.exit();
		}
	}

	async recognize(buffer: Buffer): Promise<IOcrResult> {
		const base64 = buffer.toString("base64");
		let text = "";
		try {
			const timeout = this.options?.timeout || 3000;
			const response = await axios.post(
				"http://localhost:8000/ocr",
				{
					image: base64,
				},
				{ timeout }
			);
			const result = response.data.image as Array<IPaddleOcrItem>;
			result.forEach((item, index) => {
				const [box, content] = item;
				text += content[0];
				if (index !== result.length - 1) {
					text += "\n";
				}
			});
		} catch (error) {
			console.log(`ocr failed: ${error.message}`);
			this.options?.onError(error.message);
		} finally {
			return { text };
		}
	}
}
