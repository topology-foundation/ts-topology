import type winston from "winston";
import TransportStream from "winston-transport";

export class BrowserTransport extends TransportStream {
	private methods = {
		debug: "debug",
		error: "error",
		info: "info",
		warn: "warn",
	};

	constructor(opts?: TransportStream.TransportStreamOptions) {
		super(opts);

		if (opts?.level && opts.level in Level) {
			this.level = opts.level;
		}
	}

	public log(entry: winston.LogEntry, next: () => void): void {
		setImmediate(() => {
			this.emit("logged", entry);
		});

		const { message, level } = entry;
		const mappedMethod = this.methods[
			level as keyof typeof this.methods
		] as keyof Console;

		if (Object.getOwnPropertySymbols(entry).length >= 2) {
			// @ts-ignore
			let args = entry[Object.getOwnPropertySymbols(entry)[1]];
			args = args.length >= 1 ? args[0] : args;
			// @ts-ignore
			if (args) console[mappedMethod](message, args);
			// @ts-ignore
			else console[mappedMethod](message);
		} else {
			// @ts-ignore
			console[mappedMethod](message);
		}
		next();
	}
}

enum Level {
	error = 0,
	warn = 1,
	info = 2,
	debug = 4,
}
