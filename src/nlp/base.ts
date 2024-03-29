export interface ITranslateResult {
	text: string;
}

export interface INlpEngineOptions {
	timeout: number
	nlpPort: number
	onTranslate?: OnTranslate;
	onError?: OnError;
}

export interface IOcrEngineConstructor {
	new (options: INlpEngineOptions): INlpEngine;
}

export interface INlpEngine {
	translate(text: string): Promise<ITranslateResult>;
	init(): void;
	destroy(): void;
}

export type OnTranslate = (text: string) => string;
export type OnError = (message: string) => void;
