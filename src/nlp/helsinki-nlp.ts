import fs from "fs";
import path from "path";
import axios from "axios";
import childProcess from "child_process";
import { INlpEngine, INlpEngineOptions, ITranslateResult } from "./base";
import { inspectLog, ErrorEvent } from "../server";

export class HelsinkiNlpEngine implements INlpEngine {
	private options: INlpEngineOptions;
	private nlp: childProcess.ChildProcessWithoutNullStreams;
	constructor(options: INlpEngineOptions) {
		this.options = options;
	}

	getNlpPath() {
		const gpu = path.resolve(process.cwd(), "nlp-gpu-server");
		if (fs.existsSync(gpu)) {
			console.log("nlp-gpu-server exists! use it");
			return { nlpDir: gpu, exePath: path.resolve(gpu, "./NLP-GPU-API.exe") };
		}

		const cpu = path.resolve(process.cwd(), "nlp-server");
		if (fs.existsSync(cpu)) {
			console.log("use nlp-server");
			return { nlpDir: cpu, exePath: path.resolve(cpu, "./NLP-API.exe") };
		}

		return { nlpDir: "", exePath: "" };
	}

	async init() {
		console.log("try to init nlp engine");
		const { nlpDir, exePath } = this.getNlpPath();
		if (nlpDir && exePath) {
			return new Promise((resolve, reject) => {
				console.log("nlpDir exists, start nlp server", nlpDir);

				const port = this.options.nlpPort;
				const nlp = childProcess.spawn(exePath, [`--lang-from=en`, `--lang-to=zh`, `--model-dir=.\\model`, `--port=${port}`], { windowsHide: true, detached: false /** hide console */ });
				this.nlp = nlp;
				nlp.stdout.on("data", (data) => {
					const log = data?.toString() ?? "";
					const isError = inspectLog(log);
					if(isError) {
						reject(false);
					}
					if(log.endsWith("INFO") || log.endsWith("INFO : ") || log === "\r\n" || log.includes("length:") || log.includes("Request ContentType")) {
						// ignore them
					} else {
						console.log(`stdout: ${log}`);
					}
					if (data.includes("has been started")) {
						console.log("nlp server started");
						resolve(true);
					}
				});

				nlp.stderr.on("data", (data) => {
					const isError = inspectLog(data?.toString());
					if(isError) {
						reject(false);
					}
					console.error(`stderr: ${data}`);
				});

				nlp.on("close", (code) => {
					console.log(`nlp server exit: ${code}`);
					reject(false);
				});
			});
		} else {
			console.log(ErrorEvent.NlpServerNotExist.log);
			inspectLog(ErrorEvent.NlpServerNotExist.log);
		}
	}

	async destroy() {
		if (this.nlp) {
			console.log("exit nlp server process");
			this.nlp.kill();
			process.kill(this.nlp?.pid);
			process.exit();
		}
	}

	async translate(text: string): Promise<ITranslateResult> {
		try {
			const timeout = this.options.timeout;
			const port = this.options.nlpPort;
			const translated = await axios.post(
				`http://localhost:${port}/translate`,
				{
					text,
				},
				{ timeout }
			);
			const result = translated.data.result[0].translation_text;
			return { text: result };
		} catch (error) {
			console.log(`translate failed: ${error.message}`);
			return { text: "" };
		}
	}
}
