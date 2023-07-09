"use strict";
import WebSocket from 'ws';
import TelegramBot from 'node-telegram-bot-api';

const ws = new WebSocket('wss://api.loliland.ru/ws');

const DataMap = new Map();

ws.on('error', console.error);

ws.once('open', function open() {
	setInterval(() => {ws.send('{"packet":"ping","data":{}}')}, 1500);
});

ws.on('message', function message(data) {
	try {
		let a = JSON.parse(data);
		if(a.packet === 'monitoring') {
			let entries = Object.entries(a.data.servers);
			for (const entry of entries) {
				//console.log(entry);
				let element = entry[1];

				let a = [];
				for (const el of Object.entries(element.servers)) {
					a.push(el[1]);
				}

				DataMap.set(element.name, {
					name: element.name,
					playerCount: element.online,
					playerMaxCount: element.max_online,
					servers: a
				});
			}
		}

	}
	catch (e) {
		console.error(e);
	}
});

const config = {
	token: '5804972045:AAGTZ3JMd6zl5eHa0dTsbZ7vfyjGjmELXkg',
	prefix: '/'
};

const answer = {
	info: '*Бот RYA* — для отправки уведомлений о событиях нашей инфроструктуры *RYA*\\!',
	ok: '*OK\\.*',
	err: '*ERROR\\!*',
	notFound: '*Not Found\\.*'
};

let bot = new TelegramBot(config.token, {polling: true});

function seeder(str) {
	let split = str.slice(1).split(' ');
	return {
		name: split[0],
		parameters: split.filter((value, index, array) => index !== 0)
	}
}

function FormatMarkdownV2(rawString) {
	const chars = ['_', '*', '[', ']', '(', ')', '~', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];

	let str = rawString;
	for (const char of chars) {
		let reg = new RegExp(`[\\${char}]`, 'g');
		str = str.replace(reg, `\\${char}`);
	}
	return str;
}

function FormatTable(arr, title, level = 0, isArray = false) {
	let msg = title + '\n';
	function r(int, str){
		return int > 0 ? str.repeat(int) : '';
	}

	function tap(str) {
		return str !== undefined && str !== '' ? str : 'none';
	}

	function form(char, item, item2) {

		let t = '';
		if (element[1].constructor === Object)
			t = FormatTable(Object.entries(element[1]), `${r(level, '    ')}└ ${element[0]}:`, level + 1);
		else if (element[1].constructor === Array) {
			t = FormatTable(element[1], `${r(level, '    ')}└ ${element[0]}:`, level + 1, true);
			console.log(element);
		}
		else
			t = `${r(level, '    ')}├ ${element[0]}: \`${tap(element[1])}\`\n`;
		return t;
	}
	
	if (isArray) {
		for (let element of arr/*.slice(0, -1)*/) {
			let t = '';
			if (element.constructor === Object)
				t = FormatTable(Object.entries(element), `${r(level, '    ')}└──── :`, level + 1);
			else if (element.constructor === Array)
				t = FormatTable(element, `${r(level, '    ')}└──── :`, level + 1, true);
			else
				t = `${r(level, '    ')}├──── : \`${element}\`\n`;
			msg += t;
		}
	}
	else {
		for (let element of arr.slice(0, -1)) {
			let t = '';
			if (element[1].constructor === Object)
				t = FormatTable(Object.entries(element[1]), `${r(level, '    ')}└ ${element[0]}:`, level + 1);
			else if (element[1].constructor === Array) {
				t = FormatTable(element[1], `${r(level, '    ')}└ ${element[0]}:`, level + 1, true);
				console.log(element);
			}
			else
				t = `${r(level, '    ')}├ ${element[0]}: \`${tap(element[1])}\`\n`;
			msg += t;
		}

		let last = arr[arr.length - 1];
		let tt = '';
		if (last[1].constructor === Object)
			tt = FormatTable(Object.entries(last[1]),`${r(level, '    ')}└ ${last[0]}:`, level + 1);
		else if (last[1].constructor === Array) {
			tt = FormatTable(last[1], `${r(level, '    ')}└ ${last[0]}:`, level + 1, true);
			console.log(last);
		}
		else
			tt = `${r(level, '    ')}└ ${last[0]}: \`${tap(last[1])}\`\n`;
		msg += tt;
	}



	return msg;
}

bot.setMyCommands(
	[{
	command: '/online',
	description: 'Получение онлайна серверов.'
}]
).then(r => console.info(`Commands load: ${r}`));

bot.on('message', async (msg) => {
	try {
		if (!msg.text || !msg.text.startsWith(config.prefix)) {
			await bot.sendMessage(msg.chat.id, answer.err, {parse_mode: 'MarkdownV2'});
			return;
		}
		const chatId = msg.chat.id;

		let t = seeder(msg.text);

		if (t.name === 'online') {
			let serverArrStr = new Map();

			for (const dataMapElement of DataMap) {
				let element = dataMapElement[1];

				let servers = Object.entries(element); /*Object.values(element.servers);*/
				//console.log(element.servers.constructor);

				let temp = FormatTable(servers, element.name, 0);


				serverArrStr.set(element.name, temp/*`Server: ${element.name}:\n${serverList}`*/);
			}

			if (t.parameters.length === 0) {
				let map = Array.from(serverArrStr.values());
				for (let mapElement of map) {
					await bot.sendMessage(msg.chat.id, FormatMarkdownV2(mapElement), {parse_mode: 'MarkdownV2'})
				}
			}
			/*else {
				let f = [];
				function c(str, regexp) {
					let a = str.replace(/([a-z])([A-Z])/g, '$1 $2').split(' ');
					for (let aEl of a) {
						if (aEl === regexp) return true;
					}
					return false;
				}

				for (const parameter of t.parameters) {
					for (const serverArrStrEl of serverArrStr) {
						if (parameter === serverArrStrEl[0] || c(serverArrStrEl[0], parameter)) f.push(serverArrStrEl[1]);
					}
				}
				if (f.length !== 0)
					await bot.sendMessage(msg.chat.id, FormatMarkdownV2(f.join('\n')), {parse_mode: 'MarkdownV2'});
				else
					await bot.sendMessage(msg.chat.id, answer.notFound, {parse_mode: 'MarkdownV2'});
			}*/

			return;
		}


		await bot.sendMessage(msg.chat.id, answer.err, {parse_mode: 'MarkdownV2'});
	}
	catch (e) {
		console.error(e);
	}
});

/*
setInterval(() => {
	for (const dataMapElement of DataMap) {
		let element = dataMapElement[1];

		let serverList = '';
		for (const server of element.servers) {
			serverList += `Nunber: ${server.num} Players count: ${server.online}/${server.max_online}\n`;
		}

		let msg = `Server: ${element.name}:\n${serverList}`;
		console.log(msg);
		/!*let a = "";
		console.log(element.name)*!/
	}
	console.log();
}, 5000);*/
