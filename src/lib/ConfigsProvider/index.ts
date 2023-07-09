import * as process from 'process';
import fs from 'fs';
import * as path from 'path';


let config: {[key: string]: any | undefined} = {};
try {
	config = require(path.resolve('./configs/main_config.json')) as {[key: string]: any | undefined};
	/*fs.readdir(path.resolve('./configs'), (err, files) => {
		files.
	});
	console.log();*/
}
catch (e) {
	console.error(e);
}


namespace ConfigsProvider {
	export class ConfigElement<T> {
		private _name: string;
		private _nameConfig: string;
		private _nameEnv: string;
		private readonly _data: T | null;


		get name() {
			return this._name;
		}
		get nameConfig() {
			return this._nameConfig;
		}

		get nameEnv() {
			return this._nameEnv;
		}

		get data() {
			return this._data;
		}

		constructor(name: string, nameConfig: string, nameEnv: string) {
			this._name = name;
			this._nameConfig = nameConfig;
			this._nameEnv = nameConfig;

			this._data = process.env[nameEnv] ?? config[nameConfig] ?? null;
		}
	}

	export class ConfigsList {
		private _data: Map<string, ConfigElement<any>>;

		get data() {
			return this._data;
		}

		AddData(value: ConfigElement<any> | ConfigElement<any>[]){
			if (value instanceof Array || value.constructor === Array)
				for (let valueElement of value) {
					this._data.set(valueElement.name, valueElement);
				}
			else
				this._data.set(value.name, value);
		}

		constructor(value: ConfigElement<any> | ConfigElement<any>[] | null = null) {
			this._data = new Map<string, ConfigElement<any>>();
			if (value != null) this.AddData(value);
		}
	}
}

export default ConfigsProvider;