import WebSocket from 'ws';
import Storage from "@/lib/Storage";
import Joi from "joi";

namespace MonitoringProvider {
	
	export type _OLD_WSSServerDataType = {
		name: string,
		online: number,
		max_online: number,
		servers: Array<any>
	};

	export type WSSServerDataType = {
		data: {
			servers: {
				[key: string]: {
					name: string,
					online: number,
					max_online: number,
					count: number,
					servers: {
						[key: string]: {
							num: number,
							online: number,
							max_online: number
						}
					},
					version: string
				}
			}
		},
		packet: 'monitoring' | 'ping' | string
	};

	let wss: WebSocket | null = null;

	const wsDataContextSchema = Joi.object({
		data: Joi.object({
			servers: Joi.object().pattern(/\b\w+(?:_\w+)*\b/, Joi.object({
				name: Joi.string().required(),
				count: Joi.number().required(),
				online: Joi.number().required(),
				max_online: Joi.number().required(),
				servers: Joi.object().pattern(/^\d+$/, Joi.object({
					num: Joi.number().required(),
					online: Joi.number().required(),
					max_online: Joi.number().required()
				})).required(),
				version: Joi.string().required()
				}).required()
			).required()
		}).pattern(Joi.string(), Joi.any()).required(),
		packet: Joi.string().required()
	}).required();
	
	function DataContextParse(data: any) {
		let temp = wsDataContextSchema.validate(data);
		if (temp.error != null) throw new Error(temp.error.message);

		return temp.value as WSSServerDataType;
	}

	export function Listen(url: string) {
		const wss = new WebSocket(url);

		wss.on('error', console.error);

		wss.once('open', function open() {
			setInterval(() => { wss.send('{"packet":"ping","data":{}}') }, 1500);
		});

		wss.on('message', function message(rawBuffer) {
			try {
				let data = JSON.parse(rawBuffer.toString());
				if(data.packet === 'monitoring') {
					const ctx = DataContextParse(data);

					let entries = Object.entries(ctx.data.servers);
					for (const entry of entries) {
						let element = entry[1];

						let a = Object.values(element.servers).map((item) => { return {online: item.online, maxOnline: item.max_online}});

						Storage.ServerData.set(element.name, {
							online: element.online,
							maxOnline: element.max_online,
							servers: a,
							version: element.version
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