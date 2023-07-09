import WebSocket from 'ws';
import Storage from "@/lib/Storage";

namespace MonitoringProvider {

	export type WSSServerDataType = {
		name: string,
		online: number,
		max_online: number,
		servers: Array<any>
	};

	let wss: WebSocket | null = null;

	export function Listen(url: string) {
		const wss = new WebSocket(url);

		wss.on('error', console.error);

		wss.once('open', function open() {
			setInterval(() => {wss.send('{"packet":"ping","data":{}}')}, 1500);
		});

		wss.on('message', function message(data) {
			try {
				let a = JSON.parse(data.toString());
				if(a.packet === 'monitoring') {
					let entries = Object.entries(a.data.servers);
					for (const entry of entries) {
						let element = entry[1] as WSSServerDataType;

						let a = Object.values(element.servers);

						Storage.ServerData.set(element.name, {
							name: element.name,
							online: element.online,
							maxOnline: element.max_online,
							servers: a
						});
					}
				}

			}
			catch (e) {
				console.error(e);
			}
		});

		return wss;
	}


}

export default MonitoringProvider;