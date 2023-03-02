export interface IOcrResult {
	text: string;
}

export interface IOcrEngineOptions {
	timeout?: number
	onRecognize?: OnRecognize;
	onError?: OnError;
}

export interface IOcrEngineConstructor {
	new (options: IOcrEngineOptions): IOcrEngine;
}

export interface IOcrEngine {
	recognize(buffer: Buffer): Promise<IOcrResult>;
	init(): void;
	destroy(): void;
}

export type OnRecognize = (progress: number) => void;
export type OnError = (message: string) => void;
