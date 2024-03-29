import express from "express";
import path from "path";
import { getWebUiConfig } from "../config";
import { Server } from "socket.io";
import http from "http";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
	},
});

const sockets = new Map<any, { connected: boolean }>();

type SubtitleType = { zh: string; en: string };
const cachedSubtitles: SubtitleType[] = [];

type ErrorEventType = { log: string; message: string; link?: string };
const cachedErrorEvent: ErrorEventType[] = [];
const emitedError = new Set<string>();
const logHistory: string[] = [];

export function isInitError() {
	return cachedErrorEvent.length !== 0 || emitedError.size !== 0;
}

export const ErrorEvent = {
	NlpServerNotExist: {
		log: "[ERROR] nlp server not exist",
		message: "没有找到 NLP 服务器, 请检查目录结构。",
		link: "https://rerender2021.github.io/products/language-shadow/#%E5%AE%89%E8%A3%85",
	},
	OcrServerNotExist: {
		log: "[ERROR] ocr server not exist",
		message: "没有找到 OCR 服务器, 请检查目录结构。",
		link: "https://rerender2021.github.io/products/language-shadow/#%E5%AE%89%E8%A3%85",
	},
	ChineseInPath: {
		log: "[ERROR] chinese found in path",
		message: "请检查软件路径是否包含中文, 若包含, 需修改为英文。",
	},
	PortUsed: {
		log: "[ERROR] port used",
		message: "端口被占用, 需解除端口占用后再运行。",
		link: "https://www.runoob.com/w3cnote/windows-finds-port-usage.html",
	},
};

export function inspectLog(log: string) {
	// console.log("inspect log", { log });
	logHistory.push(log);
	if (log === ErrorEvent.NlpServerNotExist.log) {
		emitErorrEvent(ErrorEvent.NlpServerNotExist);
		return true;
	} else if (log === ErrorEvent.OcrServerNotExist.log) {
		emitErorrEvent(ErrorEvent.OcrServerNotExist);
		return true;
	} else if (log.includes("WinError 1225") || log.includes("character maps to <undefined>")) {
		emitErorrEvent(ErrorEvent.ChineseInPath);
		return true;
	}else if (log.includes("error while attempting to bind on address")) {
		const port = log?.split("127.0.0.1', ")?.[1]?.substring(0, 4);
		if (port) {
			emitErorrEvent({
				log: `${port} ${ErrorEvent.PortUsed.log}`,
				message: `${port} ${ErrorEvent.PortUsed.message}`,
				link: ErrorEvent.PortUsed.link,
			});
			return true;
		}
	}

	return false;
}

function emitErorrEvent(event: ErrorEventType) {
	if (sockets.size === 0) {
		cachedErrorEvent.push(event);
		console.log("[EMIT] cache error event", { event });
	} else {
		// emit cached
		if (cachedErrorEvent.length !== 0) {
			emitCachedErrorEvent();
		}

		// emit current
		emitLanguageShadowError(event);

		// send log history
		io.emit("log-history", { logHistory });
	}
}

function emitLanguageShadowError(event: ErrorEventType) {
	if (!emitedError.has(event.log)) {
		io.emit("language-shadow-error", event);
		console.log("[EMIT] emit error event", { event });
		emitedError.add(event.log);
	}
}

function emitCachedErrorEvent() {
	console.log("[EMIT] emit cached error event");
	cachedErrorEvent.forEach((event) => {
		emitLanguageShadowError(event);
	});
	cachedErrorEvent.splice(0, cachedErrorEvent.length);
}

// https://socket.io/get-started/chat#integrating-socketio
export function emitSubtitleEvent(subtitle: SubtitleType) {
	if (sockets.size === 0) {
		cachedSubtitles.push(subtitle);
	} else {
		if (cachedSubtitles.length !== 0) {
			emitCachedSubtitleEvent();
		}
		io.emit("subtitle", subtitle);
	}
}

function emitCachedSubtitleEvent() {
	cachedSubtitles.forEach((subtitle) => {
		io.emit("subtitle", subtitle);
	});
	cachedSubtitles.splice(0, cachedSubtitles.length);
}

export function emitFlushEvent() {
	io.emit("flush");
}

export function shutdown() {
	server.close();
	io.close();
	process.exit();
}

export function startLanguageShadowWebUI() {
	const root = path.resolve(process.cwd(), "./language-shadow-web-ui-v1.2.0");
	app.use(express.static(root));

	const { port } = getWebUiConfig();

	app.get("/", (req, res) => {
		res.send("Hello Language Shadow!");
	});

	io.on("connection", (socket) => {
		console.log("a client connected");
		sockets.set(socket, {
			connected: true,
		});

		if (cachedErrorEvent.length !== 0) {
			emitCachedErrorEvent();
		}

		if (cachedSubtitles.length !== 0) {
			emitCachedSubtitleEvent();
		}

		socket.on("disconnect", (reason) => {
			sockets.delete(socket);
		});
	});

	process.on('exit', function (){
		shutdown();
		console.log('process end!');
	});

	try {
		server.listen(port, () => {
			console.log(`language shadow web ui server listening on port ${port}`);
		});

		server.on('error', (error) => {
			shutdown();
			console.error(error);
		});

	} catch (error) {
		console.error(error);
	}

}
