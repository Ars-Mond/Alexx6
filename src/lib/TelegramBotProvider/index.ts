import TelegramBot from 'node-telegram-bot-api';
import Storage from '@/lib/Storage';
import Fuse from "fuse.js";

namespace TelegramBotProvider {

	const answer = {
		info: '*Бот RYA* — для отправки уведомлений о событиях нашей инфроструктуры *RYA*\\!',
		ok: '*OK\\.*',
		err: '*ERROR\\!*',
		notFound: '*Not Found\\.*'
	};


	function seeder(str: string) {
		let split = str.slice(1).split(' ');
		return {
			name: split[0],
			parameters: split.filter((value, index, array) => index !== 0)
		}
	}

	function Russifier(str: string) {
		 const obj = {
			 online: 'Онлайн',
			 maxOnline: 'Макс. Онлайн',
			 servers: 'Сервера',
			 version: 'Версия',
			 node: '| пустышка |'
		 };

		 // @ts-ignore
		return obj[str] ?? str;
	}

	function FormatMarkdownV2(rawString: string) {
		const chars = ['_', '*', '[', ']', '(', ')', '~', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];

		let str = rawString;
		for (const char of chars) {
			let reg = new RegExp(`[\\${char}]`, 'g');
			str = str.replace(reg, `\\${char}`);
		}
		return str;
	}

	function FormatTable(arr: Array<any>, title: string, level: number = 0, isArray: boolean = false) {
		let msg = title + '\n';
		function r(count: number, str: string){
			return count > 0 ? str.repeat(count) : '';
		}

		function tap(str: string) {
			return str !== undefined && str !== '' ? str : 'none';
		}

		function line(char: string, placeholder: string, count: number, item: any, item2: any = null) {
			return item2 != null
				? r(count, placeholder) + char + ' ' + item + ': \`' + item2 + '\`' //`${s}${char} ${item2}: \`${item}\`\n`;
				: r(count, placeholder) + char + ' ' + item + ':'
		}

		function form(char: string, item: any, item2: any = '') {

			let t = '';
			let s = r(level, '    ');

			switch (item?.constructor) {
				case Array:
					t = FormatTable(
						item,
						line('└', '    ', level, Russifier(item2)), // `${s}└ ${Russifier(item2)}:`
						level + 1);
					break;

				case Object:
					t = FormatTable(
						Object.entries(item),
						line('└', '    ', level, Russifier(item2)), // `${s}└ ${Russifier(item2)}:`
						level + 1);
					break;

				default:
					t = line(char, '    ', level, Russifier(item2), item) + '\n'; // t = `${s}${char} ${item2}: \`${item}\`\n`;
					break;
			}
			return t;
		}


		for (let element of arr.slice(0, -1)) {
			msg += form('├',element[1] ?? element, element[0] ?? '┐');
		}

		let last = arr[arr.length - 1];
		msg += form('└', last[1] ?? last, last[0] ?? '┐');
		return msg;
	}

	export function Listen(token: string, prefix: string) {

		const bot = new TelegramBot(token, {polling: true});

		bot.setMyCommands(
			[{
				command: '/online',
				description: 'Получение онлайна серверов.'
			}],
			{
				language_code: 'ru'
			}
		).then(r => console.info(`Commands load: ${r}`));

		bot.on('message', async (msg) => {
			try {
				if (!msg.text || !msg.text.startsWith(prefix)) {
					await bot.sendMessage(msg.chat.id, answer.err, {parse_mode: 'MarkdownV2'});
					return;
				}

				let t = seeder(msg.text);

				if (t.name === 'online') {
					let serverArrStr = new Map<string, string>();
					let list = [];

					for (const serverDatum of Storage.ServerData) {
						let element = serverDatum[1];
						let name = serverDatum[0];

						 let servers = Object.entries(element);

						let result = FormatTable(servers, '⚙️' + serverDatum[0], 0);

						list.push({
							name: name,
							context: result
						});
						serverArrStr.set(name, result);
					}

					const fuze = new Fuse(list, {
						keys: ['name'],
						threshold: 0.3
					});

					if (t.parameters.length === 0) {
						for (let element of list) {
							await bot.sendMessage(msg.chat.id, FormatMarkdownV2(element.context), {parse_mode: 'MarkdownV2'})
						}
					}
					else {

						let from = Object.entries(serverArrStr);

						let search = fuze.search(t.parameters.join(' '), { limit: 2 });

						for (let element of search) {
							await bot.sendMessage(msg.chat.id, FormatMarkdownV2(element.item.context), {parse_mode: 'MarkdownV2'})
						}
					}

					return;
				}

				await bot.sendMessage(msg.chat.id, answer.err, {parse_mode: 'MarkdownV2'});
			}
			catch (e) {
				console.error(e);
			}
		});

		return bot;
	}
}

export default TelegramBotProvider;


/*
		bot.on('callback_query', async (msg) => {
			reply_markup: {
				inline_keyboard: [[{
					text: 'Hello',
					callback_data: 'ddsdsd'
				}]]
			}
		});*/