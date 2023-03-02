import path from "path";
import fs from "fs";
import { IOcrEngineOptions } from "../ocr/base";

const defaultConfig = {
	/** timeout for ocr and translate api call*/
	timeout: 3000,
};

export function getConfig() {
	const configPath = path.resolve(process.cwd(), "./config.json");
	if (!fs.existsSync(configPath)) {
		console.log(`config not exist at ${configPath}, create it!`);
		fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 4), "utf-8");
	}

	try {
		const configJson = JSON.parse(fs.readFileSync(configPath, "utf-8"));
		console.log(`parse config succeed, use it`);
		return configJson;
	} catch (error) {
		console.log(`parse config failed, ${error?.message}, use default config`);
		return defaultConfig;
	}
}

export function getOcrConfig(): IOcrEngineOptions {
	const config = getConfig();
	return {
		timeout: config?.timeout || 3000,
	};
}
