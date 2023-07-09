
namespace Storage {

	export type ServerDataType = {
		name: string,
		online: number,
		maxOnline: number,
		servers: Array<any>
	};
	export const ServerData: Map<string, ServerDataType> = new Map();
	export class DataStorage<T extends Object> {
		private _data: Map<string, T>;

		constructor() {
			this._data = new Map<string, T>()
		}
	}
}

export default Storage;