import { VK } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import {
    QuestionManager,
    IQuestionMessageContext
} from 'vk-io-question';
import { registerUserRoutes } from './engine/player'
import { InitGameRoutes } from './engine/init';
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { env } from 'process';
import { Engine_Answer, User_Registration, User_ignore_Check } from './engine/helper';
import prisma from './module/prisma';
const natural = require('natural');
const RussianNouns = require('russian-nouns-js');
const rne = new RussianNouns.Engine(); //Адская махина склонений

dotenv.config()
export const token: string = String(process.env.token)
export const root: number = Number(process.env.root) //root user
export const bot_id: number = Number(process.env.bot_id) //root user
//export const chat_id: number = Number(process.env.chat_id) //chat for logs
//export const group_id: number = Number(process.env.group_id)//clear chat group
export const timer_text = { answerTimeLimit: 300_000 } // ожидать пять минут
export const answerTimeLimit = 300_000 // ожидать пять минут
//авторизация
export const vk = new VK({ token: token, /*pollingGroupId: group_id,*/ apiMode: "sequential", apiLimit: 1 });
//инициализация
const questionManager = new QuestionManager();
const hearManager = new HearManager<IQuestionMessageContext>();

export const tokenizer = new natural.AggressiveTokenizerRu()
export const tokenizer_sentence = new natural.SentenceTokenizer()
let max_sel = 0
let max_create = 0
let sum_sel = 0
let sum_create = 0
let count_sel = 0
let count_create = 0
let count_temp = 0
prisma.$use(async (params, next) => {
	const before = Date.now()
	const result = await next(params)
	const after = Date.now()
	const temp = after - before
	if (params.action == 'create') { sum_create += temp; count_create++; console.log(`Query ${params.model}.${params.action} took: ${temp} ms`)}
	if (params.action == 'delete') { sum_sel += temp; count_sel++; console.log(`Query ${params.model}.${params.action} took: ${temp} ms`)}
	if (params.action == 'create' && max_create < temp) { max_create = temp}
	if (params.action == 'delete' && max_sel < temp) { max_sel = temp}
	count_temp++
	//console.log(`Query ${params.model}.${params.action} took: ${temp} ms`)
	
	if (count_temp > 100) {
		/*await vk.api.messages.send({
			peer_id: root,
			random_id: 0,
			message: `findMany: sum-${sum_sel}ms count-${count_sel} max-${max_sel}ms avg-${sum_sel/count_sel}ms \n create: sum-${sum_create}ms count-${count_create} max-${max_create}ms avg-${sum_create/count_create}ms`
		})*/
		count_temp = 0
		//console.log(`update: sum-${sum_sel}ms count-${count_sel} max-${max_sel}ms avg-${sum_sel/count_sel}ms \n create: sum-${sum_create}ms count-${count_create} max-${max_create}ms avg-${sum_create/count_create}ms`)
	}
	return result
})

//настройка
vk.updates.use(questionManager.middleware);
vk.updates.on('message_new', hearManager.middleware);

//регистрация роутов из других классов
InitGameRoutes(hearManager)
registerUserRoutes(hearManager)

//миддлевар для предварительной обработки сообщений
vk.updates.on('message_new', async (context: any, next: any) => {
	const regtrg = await User_Registration(context)
	if (context.isOutbox == false && await User_ignore_Check(context) && context.senderId > 0 && context.hasText) {
		if (context.isChat) {
			await context.loadMessagePayload();
			//console.log("🚀 ~ file: index.ts:78 ~ vk.updates.on ~ context", context)
			const arr: Array<string> = await tokenizer.tokenize(context.text)
			if (arr && (arr.length < 2 || arr.length > 50) && !context.replyMessage) {
				//console.log("🚀 ~ file: index.ts:81 ~ vk.updates.on ~ context.forwards", context.forwards)
				//console.log('Ответов нет, длина не соотвествует')
				return await next();
			}
			//console.log("🚀 ~ file: index.ts:78 ~ vk.updates.on ~ arr", arr.length)
			
			//console.log(context?.forwards)
			if ((context.replyMessage && context.replyMessage.senderId != bot_id) || (context.forwards > 1)) {
				//console.log('Ответ есть, но нее мне')
				//console.log("🚀 ~ file: index.ts:84 ~ vk.updates.on ~ context", context)
				return await next();
			} else {
				//console.log('Упоминания есть')
				const data = context.text.match(/\[id(\d+)\|([аА-яЯaA-zZ -_]+)\]|\[club(\d+)\|([аА-яЯaA-zZ -_]+)\]/g)
				//console.log(JSON.stringify(data))
				if (data && data.length >= 1) {
					let finder = false
					for (const i in data) {
						const data_idvk = data[i].match(/(\d+)\|/g)
						const data_name = data[i].match(/\|([аА-яЯaA-zZ -_]+)/g)
						const idvk = data_idvk.toString().replace('|', '')
						const name = data_name.toString().replace('|', '').replace(']', '')
						//await context.send(`${data_idvk} ${data_name}`)
						//console.log(`${idvk} ${name}`)
						if (idvk == bot_id) {
							//console.log('Check')
							finder = true
							context.text = `${name} ${context.text}`
						}
					}
					if (!finder) { 
						//console.log('Упомянули не меня')
						return await next();
					}
				}
				
			}
		}
		await Engine_Answer(context,regtrg)
	}
	return await next();
})
/*vk.updates.on('message_event', async (context: any, next: any) => { 
	//const data = await Book_Random_String('./src/book/tom1-7.txt')
	//context.answer({type: 'show_snackbar', text: `🔔 ${data.slice(0,80)}`})
	return next();
})*/
vk.updates.start().then(() => {
	console.log('Бот успешно запущен и готов к эксплуатации!')
}).catch(console.log);