import { VK, Keyboard, IMessageContextSendOptions, ContextDefaultState, MessageContext, VKAppPayloadContext, KeyboardBuilder } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { Answer, Couple, Dictionary, PrismaClient } from '@prisma/client'
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
import { Sentence_Corrector, User_Ignore, User_Login, User_Registration, User_ignore_Check, Word_Corrector, deleteDuplicate } from './engine/helper';
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

//миддлевар для предварительной обработки сообщений
vk.updates.on('message_new', async (context: any, next: any) => {
	const regtrg = await User_Registration(context)
	if (context.isOutbox == false && await User_ignore_Check(context)) {
		if (regtrg) { await User_Ignore(context) }
		const bot_memory = await User_Login(context)
		if (!bot_memory) { return }
		const data_old = Date.now()
		const sentence: Array<string> = tokenizer_sentence.tokenize(context.text.toLowerCase())
		let ans: any = []
		for (const stce in sentence) {
			//берем предложение
			const sentence_sel: string = sentence[stce]
			//если его нет, идем дальше
			if (!sentence_sel || sentence.length < 1) { continue }
			//если оно есть, глянем в базе данных
			const sentence_check: Answer[] | null = await prisma.answer.findMany({ where: { qestion: sentence_sel }})
			if (sentence_check.length != 0) {
				ans.push({ correct_text: sentence_sel, result_text: sentence_check.length > 1 ? sentence_check[randomInt(0, sentence_check.length)].answer : sentence_check[0].answer, type: "Вопрос-Ответ"})
				continue
			}
			//если его нет в базе данных, тогда надо поискать нечетко
			const sentence_corrected = await Sentence_Corrector(sentence[stce])
			if (sentence_corrected) { 
				ans.push({correct_text: sentence_corrected.qestion, result_text: sentence_corrected.answer, type: "Вопрос-Ответ С коррекцией"})
				continue
			}
			//Если нифига нет, тогда давайте сами строить, фигли
			const word_list = tokenizer.tokenize(sentence_sel)
			let sentence_build = ''
			for (let j = 0; j < word_list.length; j++) {
				const word_input = word_list[j]
				let word_sel: string | null = null
				if (!word_input || word_input.length < 1) { continue }
				//смотрим слово в словаре
				const word_check: Dictionary | null = await prisma.dictionary.findFirst({ where: { word: word_input }})
				if (word_check) { 
					word_sel = word_check.word
				} else {
					//иначе правим ошибки
					const word: string | null = await Word_Corrector(word_input)
					if (word) { word_sel = word } else { continue }
				}
				const get_id_word: Dictionary | null = await prisma.dictionary.findFirst({ where: { word: word_sel} })
				const reseach_target: any | null = await prisma.couple.findMany({ where: { id_first: get_id_word?.id, position: j }, include: { first: true, second: true }, orderBy: {score: 'desc'} })
				if (reseach_target && reseach_target.length >= 1) {
					sentence_build += reseach_target.length > 1 ?  ` ${reseach_target[randomInt(0, reseach_target.length)].first.word} ${reseach_target[randomInt(0, reseach_target.length)].second.word} ` : ` ${reseach_target[0].first.word} ${reseach_target[0].second.word} `
					continue
				} 
				const couple: any | null = await prisma.couple.findMany({ where: { id_first: get_id_word?.id, position: j }, include: { first: true, second: true }, orderBy: {score: 'desc'} })
				if (couple && couple.length >= 1) {
					sentence_build += couple.length > 1 ? ` ${couple[randomInt(0, couple.length)].first.word} ${couple[0].second.word} ` : ` ${couple[randomInt(0, couple.length)].first.word} ${couple[0].second.word} `
					continue
				}
			}
			try {
				const sentence_new: string | null = await deleteDuplicate(sentence_build)
				if (sentence_new) {
					const res = await translate(`${sentence_new}`, { from: 'auto', to: 'en', autoCorrect: true });
					if (!res.text) { console.log(`Получено сообщение: ${context.text}, но ответ не найден`); continue }
					const fin = await translate(`${res.text}`, { from: 'en', to: 'ru', autoCorrect: true });
					ans.push({correct_text: sentence_new, result_text: fin.text, type: "Генератор Цыган"})
				}
			} catch (e) { 
				console.log(e); 
				const sentence_new: string | null = await deleteDuplicate(sentence_build)
				ans.push({correct_text: sentence_new, result_text: sentence_new, type: "Генератор"})
				continue 
			}
		}
		const answer: string = await ans.map((item: { result_text: any; }) => {return item.result_text;}).join("\r\n")
		console.log(` Получено сообщение: [${context.text}] \n Исправление ошибок: [${await ans.map((item: { correct_text: any; }) => {return item.correct_text;}).join("\r\n")}] \n Сгенерирован ответ: [${await ans.map((item: { result_text: any; }) => {return item.result_text;}).join(". ")}] \n Затраченно времени: [${(Date.now() - data_old)/1000} сек.] \n Откуда ответ: 	     [${await ans.map((item: { type: any; }) => {return item.type;}).join(" + ")}] \n\n`)
		if (answer.length > 0) { await context.send(`${answer}`) }
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