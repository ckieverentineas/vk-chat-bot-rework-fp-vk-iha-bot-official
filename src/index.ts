import { VK, Keyboard, IMessageContextSendOptions, ContextDefaultState, MessageContext, VKAppPayloadContext, KeyboardBuilder } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { PrismaClient } from '@prisma/client'
import {
    QuestionManager,
    IQuestionMessageContext
} from 'vk-io-question';
import { randomInt } from 'crypto';
import { timeStamp } from 'console';
import { registerUserRoutes } from './engine/player'
import { InitGameRoutes } from './engine/init';
import { send } from 'process';
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { env } from 'process';
const Fuse = require("fuse.js")
const natural = require('natural');
const translate = require('secret-package-for-my-own-use');
const RussianNouns = require('russian-nouns-js');
const rne = new RussianNouns.Engine(); //Адская махина склонений

dotenv.config()
export const token: string = String(process.env.token)
export const root: number = Number(process.env.root) //root user
export const chat_id: number = Number(process.env.chat_id) //chat for logs
export const group_id: number = Number(process.env.group_id)//clear chat group
export const timer_text = { answerTimeLimit: 300_000 } // ожидать пять минут
export const answerTimeLimit = 300_000 // ожидать пять минут
//авторизация
export const vk = new VK({ token: token, /*pollingGroupId: group_id,*/ apiMode: "sequential", apiLimit: 1 });
//инициализация
const questionManager = new QuestionManager();
const hearManager = new HearManager<IQuestionMessageContext>();
export const prisma = new PrismaClient()

export const tokenizer = new natural.AggressiveTokenizerRu()
export const tokenizer_sentence = new natural.SentenceTokenizer()
/*prisma.$use(async (params, next) => {
	console.log('This is middleware!')
	// Modify or interrogate params here
	console.log(params)
	return next(params)
})*/

//настройка
vk.updates.use(questionManager.middleware);
vk.updates.on('message_new', hearManager.middleware);

//регистрация роутов из других классов
InitGameRoutes(hearManager)
registerUserRoutes(hearManager)
async function deleteDuplicate(a: any){a=a.toString().replace(/ /g,",");a=a.replace(/[ ]/g,"").split(",");for(var b: any =[],c=0;c<a.length;c++)-1==b.indexOf(a[c])&&b.push(a[c]);b=b.join(", ");return b=b.replace(/,/g," ")};
async function Word_Corrector(word:string) {
	const analyzer = await prisma.dictionary.count({ where: { word: word } })
	if (analyzer >= 1) { return word }
	const word_dictionary = await prisma.dictionary.findMany()
	const options = { includeScore: true, location: 2, threshold: 0.5, distance: 1, ignoreFieldNorm: true, keys: ['word'] }
	const fuse = new Fuse(word_dictionary, options)
	const finder = fuse.search(word)
	let clear: Array<string> = []
	
	for (const i in finder) {
		if (finder[i].score == finder[0].score) {
			clear.push(finder[i].item.word)
		}
	}
	return finder.length >= 1 ? finder[0].item.word : false
}
async function Sentence_Corrector(word:string) {
	const analyzer = await prisma.answer.count({ where: { qestion: word } })
	if (analyzer >= 1) { return word }
	const word_dictionary = await prisma.answer.findMany()
	const options = { includeScore: true, location: 2, threshold: 0.5, distance: 3, keys: ['qestion'] }
	const fuse = new Fuse(word_dictionary, options)
	const finder = fuse.search(word)
	console.log("🚀 ~ file: index.ts:75 ~ Sentence_Corrector ~ finder", finder)
	let clear: Array<string> = []
	
	for (const i in finder) {
		if (finder[i].score == finder[0].score) {
			clear.push(finder[i].item.qestion)
		}
	}
	return finder.length >= 1 ? finder[0].item.qestion : false
}
//миддлевар для предварительной обработки сообщений
vk.updates.on('message_new', async (context: any, next: any) => {
	if (context.isOutbox == false) {
		const data_old = Date.now()
        let count = 0
        let count_circle = 0
		const sentence: Array<string> = tokenizer_sentence.tokenize(context.text.toLowerCase())
		let ans: string = ''
		
		let finres: string = ''
		let googletr = false
		for (const stce in sentence) {
			const temp: Array<string> = tokenizer.tokenize(sentence[stce])
			if (temp.length == 0) { continue }
			const sentence_corrected = await Sentence_Corrector(sentence[stce])
			if (sentence_corrected) { 
				const answerok = await prisma.answer.findMany({ where: { qestion: sentence_corrected }, select: { answer: true } })
				if (answerok) {
					ans += ` ${answerok[randomInt(0, answerok.length)].answer} `
					finres += ` ${sentence_corrected} `
					googletr = true
					continue
				}
			}
			if (temp.length >= 1) {
				for (let j = 0; j < temp.length; j++) {
					const word: string | false = await Word_Corrector(temp[j].toLowerCase())
					if (!word) { continue}
					const check: any = await prisma.dictionary.findFirst({ where: { word: word}, select: {id: true} })
					const reseach_target: any = await prisma.couple.findMany({ where: { id_first: check.id, position: j }, include: { first: true, second: true } })
					const reseach: any = reseach_target.length >= 1 ? reseach_target : await prisma.couple.findMany({ where: { id_first: check.id }, include: { first: true, second: true } })
					if (reseach.length >= 1) {
						ans += ` ${reseach[randomInt(0, reseach.length)].first.word} ${reseach[randomInt(0, reseach.length)].second.word} `
						count++
						finres += `${word} `
					}
					count_circle++
				}   
			}
			ans += '. '
		}
		console.log("🚀 ~ file: index.ts:96 ~ vk.updates.on ~ ans", deleteDuplicate(ans))
		try {
			let ans_res = ans
			if (googletr == false) {
				const res = await translate(`${ans}`, { from: 'auto', to: 'en', autoCorrect: true });
				if (await deleteDuplicate(res.text) == ".") { console.log(`Получено сообщение: ${context.text}, но ответ не найден`); return }
				const fin = await translate(`${res.text ? await deleteDuplicate(res.text) : "Я не понимаю"}`, { from: 'en', to: 'ru', autoCorrect: true });
				ans_res = await deleteDuplicate(fin.text)
			}
			
			console.log(` Получено сообщение: [${context.text}] \n Исправление ошибок: [${finres}] \n Сгенерирован ответ: [${ans_res}] \n Количество итераций: [${count_circle}] \n Затраченно времени: [${(Date.now() - data_old)/1000} сек.] \n Откуда ответ: ${googletr ? "Вопрос-ответ" : "Генератор" } \n\n`)
			await context.send(`${ans_res}`)
		} catch {
			console.log(`Авария, Получено сообщение: ${context.text} Сгенерирован ответ: ${await deleteDuplicate(ans)}, Сложность: ${count_circle} Затраченно времени: ${(Date.now() - data_old)/1000} сек.`)
			await context.send(`${await deleteDuplicate(ans)}`)
		}
	}
	return next();
})
vk.updates.on('message_event', async (context: any, next: any) => { 
	//const data = await Book_Random_String('./src/book/tom1-7.txt')
	//context.answer({type: 'show_snackbar', text: `🔔 ${data.slice(0,80)}`})
	return next();
})
vk.updates.start().then(() => {
	console.log('LongPool server up!')
}).catch(console.log);