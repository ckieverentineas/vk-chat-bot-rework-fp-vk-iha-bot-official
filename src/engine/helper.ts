import { Answer, Dictionary } from "@prisma/client";
import { bot_id, root, tokenizer, tokenizer_sentence, vk } from "..";
import { randomInt } from "crypto";
import { Message_Education_Module } from "./parser";
import prisma from "../module/prisma";
const getSlug  = require('speakingurl');
const Fuse = require("fuse.js")
const translate = require('secret-package-for-my-own-use');
const {distance, closest} = require('fastest-levenshtein')

async function* Generator_Word() {
    const limiter = 10000
    const firstQueryResults: Dictionary[] | null = await prisma.dictionary.findMany({ take: limiter, orderBy: { id: 'asc' } })
    const max: Dictionary | null = await prisma.dictionary.findFirst({ orderBy: { id: 'desc' } })
    yield firstQueryResults
    let myCursor: number | undefined = firstQueryResults[firstQueryResults?.length-1]?.id
    while (myCursor != null && max != null && myCursor <= max.id && myCursor != undefined) {
        const nextQueryResults: Dictionary[] | null = await prisma.dictionary.findMany({ take: limiter, skip: 1, cursor: { id: myCursor },orderBy: { id: 'asc' } })
        yield nextQueryResults
        myCursor = nextQueryResults[nextQueryResults.length-1]?.id 
    }
}
async function* Generator_Sentence() {
    const limiter = 100000
    const firstQueryResults: Answer[] | null = await prisma.answer.findMany({ take: limiter, orderBy: { id: 'asc' } })
    const max: Answer | null = await prisma.answer.findFirst({ orderBy: { id: 'desc' } })
    yield firstQueryResults
    let myCursor: number | undefined | null = firstQueryResults[firstQueryResults.length-1]?.id || undefined
    while (myCursor && max != null && myCursor <= max.id) {
        const nextQueryResults: Answer[] | null = await prisma.answer.findMany({ take: limiter, skip: 1, cursor: { id: myCursor },orderBy: { id: 'asc' } })
        yield nextQueryResults
        myCursor = nextQueryResults[nextQueryResults.length-1]?.id 
    }
}
export async function Word_Corrector_Second(word:string) {
    const analyzer: Dictionary | null = await prisma.dictionary.findFirst({ where: { word: word } })
    if (analyzer != null) { return word }
    let generator_word: any = Generator_Word();
    let clear: any = []
    for await (const line of generator_word) {
        let temp = [];
        for (const i in line) { temp.push(line[i].word) } 
        //console.log(`Итерация ${line[0]?.id}`)
        let results = await closest(word,  temp)
        if (results) {
            for (const i in line) { 
                if (results == line[i].word) { clear.push({ id: line[i].id, word: line[i].word, score: line[i].score, crdate: line[i].crdate }) }
            }
        }
        await generator_word.next()
    }
    const options = { includeScore: true, location: 2, threshold: 0.5, distance: 1, ignoreFieldNorm: true, keys: ['word'] }
    const myIndex = await Fuse.createIndex(options.keys, clear)
    const fuse = new Fuse(clear, options, myIndex)
    const finders = await fuse.search(word)
    const finder: any = []
    for (const i in finders) { if (finders[i].score <= 0.9 && finders[i].score == finders[0].score) { await finder.push(finders[i].item) } }
    //console.log(`слов после ${clear.length} ${JSON.stringify(clear.slice(0, 3))}`)
    return await finder?.length >= 1 ? await finder[0]?.word : null
}
export async function Sentence_Corrector_Second(word:string) {
	const analyzer: Answer | null = await prisma.answer.findFirst({ where: { qestion: word } })
	if (analyzer != null) { return word }
    let generator_sentence: any = Generator_Sentence();
    let clear: any = []
    for await (const line of generator_sentence) {
        let temp = [];
        for (const i in line) { temp.push(line[i].qestion) } 
        //console.log(`Итерация ${line[0]?.id}`)
        let results = await closest(word,  temp)
        if (results) {
            for (const i in line) { 
                if (results == line[i].qestion) { clear.push({ qestion: line[i].qestion, answer: line[i].answer })}
            }
        }
        await generator_sentence.next()
    }
    const options = { includeScore: true, location: 2, threshold: 0.5, distance: 3, keys: ['qestion'] }
    const myIndex = await Fuse.createIndex(options.keys, clear)
    const fuse = new Fuse(clear, options, myIndex)
    const finders = await fuse.search(word)
    const finder: any = []
    for (const i in finders) { if (finders[i].score <= 0.9 && finders[i].score == finders[0].score) { finder.push(finders[i].item) } }
    if (finders.length >= 1) {
        return await finder?.length > 1 ? finder[randomInt(0, finder.length)] : finder[0]
    } else { return null}
}
export async function Word_Corrector(word:string) {
	const analyzer: Dictionary | null = await prisma.dictionary.findFirst({ where: { word: word } })
    if (analyzer != null) { return word }
    let generator_word: any = Generator_Word();
    const options = { includeScore: true, location: 2, threshold: 0.5, distance: 1, ignoreFieldNorm: true, keys: ['word'] }
    let clear: any = []
    for await (const line of generator_word) {
        const myIndex = await Fuse.createIndex(options.keys, line)
        const fuse = new Fuse(line, options, myIndex)
        const finder = await fuse.search(word)
        for (const i in finder) { if (finder[i].score < 0.5) { clear.push(finder[i]) } }
        await generator_word.next()
    }
    //console.log(`слов до ${clear.length} ${JSON.stringify(clear.slice(0, 3))}`)
    await clear.sort(function(a:any, b:any) {return a.score - b.score})
    //console.log(`слов после ${clear.length} ${JSON.stringify(clear.slice(0, 3))}`)
    return await clear?.length >= 1 ? clear[0].item.word : null
}
export async function Sentence_Corrector(word:string) {
	const analyzer: Answer | null = await prisma.answer.findFirst({ where: { qestion: word } })
	if (analyzer != null) { return word }
    let generator_sentence: any = Generator_Sentence();
    const options = { includeScore: true, location: 2, threshold: 0.5, distance: 3, keys: ['qestion'] }
    let clear: any = []
    for await (const line of generator_sentence) {
        //console.log(`Итерация ${line[0]?.id}`)
        const myIndex = await Fuse.createIndex(options.keys, line)
        const fuse = new Fuse(line, options, myIndex)
        const finder = await fuse.search(word)
        for (const i in finder) { if (finder[i].score < 0.5) { clear.push(finder[i]) } }
        await generator_sentence.next()
    }
    //console.log(`тексто до ${clear.length} ${JSON.stringify(clear.slice(0, 3))}`)
    await clear.sort(function(a:any, b:any) {return a.score - b.score}).slice(0, 10)
    //console.log(`текст после ${clear.length} ${JSON.stringify(clear.slice(0, 3))}`)
    return await clear ? clear.length > 1 ? clear[randomInt(0, clear.length)].item : clear[0]?.item : null
}
export async function Answer_Duplicate_Clear(context: any) {
	const analyzer: Answer | null = await prisma.answer.findFirst({})
	if (!analyzer) { return context.send(`Удалять нечего! База пуста`) }
    let generator_sentence: any = Generator_Sentence();
    let counter_translit: number = 0
    let counter_delete: number = 0
    for await (const line of generator_sentence) {
        console.log(`Итерация ${line[0]?.id}`)
        for (const i in line) {
            if (line[0]?.id ==  line[i]?.id) { console.log(`Итерация ${line[0]?.id}: ${i}`)}
            if (line[line.length]?.id == line[i]?.id) { console.log(`Итерация ${line[line.length]?.id}: ${i}`)}
            try {
                const data_check: Answer | null = await prisma.answer.findFirst({where: { id: line[i].id }})
                if (data_check) {
                    if (data_check.answer.includes('https:') || data_check.answer.includes('http:')) { 
                        const data_delete: Answer | null = await prisma.answer.delete({ where: {id: data_check.id} })
                        if (data_delete) { console.log(`\nУдален ссылочный вопрос-ответ ${data_delete.id}: \n ${data_check.qestion} >> ${data_check.answer}\n`); counter_delete++ }
                        continue
                    }
                    const qestion = getSlug(data_check.qestion, { separator: ' ', mark: true, lang: 'ru', uricNoSlash: true }).replace('- ', ' ').trim();
                    const answer = getSlug(data_check.answer, { separator: ' ', mark: true, lang: 'ru', uricNoSlash: true }).replace('- ', ' ').trim();
                    if (qestion.length > 0 && answer.length > 0) {
                        try {
                            const data_check_again: Answer | null = await prisma.answer.findFirst({ where: { qestion: qestion, answer: answer } })
                            if (data_check_again) {
                                if (data_check_again.id != line[i].id) {
                                    const data_delete: Answer | null = await prisma.answer.delete({ where: {id: data_check.id} })
                                    if (data_delete) { console.log(`\nУдален дубликат вопрос-ответ ${data_delete.id}: \n ${qestion} >> ${answer} \n ${data_delete.qestion} >> ${data_delete.answer}\n`); counter_delete++ }
                                } else {
                                    if (data_check_again.qestion != qestion && data_check_again.answer != answer) {
                                        const data_update: Answer | null = await prisma.answer.update({where: {id: data_check.id}, data: { qestion: qestion, answer: answer }})
                                        if (data_update) { 
                                            console.log(`\nВторично транслирован вопрос-ответ ${data_update.id}: \n ${line[i].qestion} >> ${line[i].answer} \n ${data_update.qestion} >> ${data_update.answer}\n`); 
                                            counter_translit++ 
                                        }
                                    }
                                }
                            } else {
                                const data_update: Answer | null = await prisma.answer.update({where: {id: data_check.id}, data: { qestion: qestion, answer: answer }})
                                if (data_update) {
                                    //console.log(`\nУспешно транслирован вопрос-ответ ${data_update.id}: \n ${line[i].qestion} >> ${line[i].answer} \n ${data_update.qestion} >> ${data_update.answer}\n`); 
                                    counter_translit++
                                }
                            }
                        } catch {
                            console.log(`Нельзя создать дубликат`)
                        }
                    } else {
                        const data_delete: Answer | null = await prisma.answer.delete({ where: {id: data_check.id} })
                        if (data_delete) { console.log(`\nУдален пустой вопрос-ответ ${data_delete.id}: \n ${qestion} >> ${answer} \n ${data_delete.qestion} >> ${data_delete.answer}\n`); counter_delete++ }
                    }
                    
                }
            } catch (e) {
                await vk.api.messages.send({
                    peer_id: root,
                    random_id: 0,
                    message: `База данных не вывезла чистку для вопрос-ответа ${line[i].id}: ${e}`
                })
            }
            
        }
        await generator_sentence.next()
    }
    const counters1 = await prisma.answer.count({})
    await context.send(`Стадия очистки I: Транслировано ${counter_translit} из ${counters1} вопрос-ответов. Удалено ${counter_delete} пусторылых`)
    let counter: number = 0
    for await (const line of generator_sentence) {
        console.log(`Итерация ${line[0]?.id}`)
        for (const i in line) {
            const data_check: Answer[] | null = await prisma.answer.findMany({where: { qestion: line[i].qestion, answer: line[i].answer }})
            if (data_check.length > 1) {
                for (let i = 1; i < data_check.length; i++) {
                    const deletes = await prisma.answer.delete({ where: { id: data_check[i].id }})
                    if (deletes) { console.log(`Успешно удален вопрос-ответ: ${deletes.id} ${deletes.qestion} >> ${deletes.answer}`) }
                    counter++
                }
            }
        }
        await generator_sentence.next()
    }
    const counters = await prisma.answer.count({})
    await context.send(`Стадия очистки II: Очищено дубликатов: ${counter}. Осталось вопрос-ответов: ${counters} из ${counters1}.`)
}
export async function deleteDuplicate(a: any){a=a.toString().replace(/ /g,",");a=a.replace(/[ ]/g,"").split(",");for(var b: any =[],c=0;c<a.length;c++)-1==b.indexOf(a[c])&&b.push(a[c]);b=b.join(", ");return b=b.replace(/,/g," ")};

export async function User_Registration(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.senderId } })
    if (!user) {
        try {
            const registration = await prisma.user.create({ data: { idvk: context.senderId}})
            console.log(`Зарегестрирован новый пользователь: ${registration.idvk}`)
            return false
        } catch (e) {
            console.log(`Возникла ошибка регистрации клиента: ${e}`)
        }
        
    }
    return true
}
export async function User_Login(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.senderId } })
    const time = new Date()
    if (user.last != context.text && user?.lastlast != context.text) {
        if (user.memorytrg != false) { await prisma.user.update({ where: { idvk: context.senderId }, data: { memorytrg: false } }) }
        if (user.count < 1) {
            const update = await prisma.user.update({ where: { idvk: context.senderId }, data: { last: context.text, lastlast: user.last, count: { increment: 1 } } })
        } else {
            const reset = await prisma.user.update({ where: { idvk: context.senderId }, data: { last: context.text, lastlast: user.last, count: 0, update: time } })
        }
        return true
    } else {
        if (user.memorytrg == false) {
            //await context.send(`🛡 Уведомление от системы памяти: \n ${user.last.length != '' ? `Вы мне уже писали ранее: ${user.last}` : '' } \n ${user.lastlast.length != '' ? `Как-то невзначай отправляли: ${user.lastlast}` : '' }.`)
            await prisma.user.update({ where: { idvk: context.senderId }, data: { memorytrg: true } })
        }
        
        if (user.count < 1) {
            const update = await prisma.user.update({ where: { idvk: context.senderId }, data: { count: { increment: 1 } } })
        } else {
            const reset = await prisma.user.update({ where: { idvk: context.senderId }, data: { count: 0, update: time } })
        }
        return false
    }
}
export async function User_Ignore(context: any) {
    const info: any = await User_Info(context)
    const time: any = new Date()
    const user: any = await prisma.user.findFirst({ where: { idvk: context.senderId } })
    if (time - user.update < 3000) {
        if (user.warning < 2) {
            const login = await prisma.user.update({ where: { idvk: context.senderId }, data: { warning: { increment: 1 } } })
            await context.send(user.warning == 0 ? `@id${context.senderId}(${info.first_name}), не отправляйте сообщения настолько часто.` : `@id${context.senderId}(${info.first_name}), не спамьте, а то будете проигнорированы в дальнейшем.`)
            console.log(`Пользователь добавлен в лист игнора: ${login.idvk}`)
        } else {
            const login = await prisma.user.update({ where: { idvk: context.senderId }, data: { ignore: user.ignore ? false : true, warning: 0 } })
            await context.send(`@id${context.senderId}(${info.first_name}), c idvk ${context.senderId} я с тобой больше не разговариваю.`)
            console.log(`Пользователь добавлен в лист игнора: ${login.idvk}`)
        }
    }
}
export async function User_Info(context: any) {
    let [userData]= await vk.api.users.get({user_id: context.senderId});
    return userData
}
export async function User_ignore_Check(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.senderId } })
    return user.ignore ? false : true
}
export async function Engine_Answer(context: any, regtrg: boolean) {
    if (regtrg) { await User_Ignore(context) }
	const bot_memory = await User_Login(context)
	if (!bot_memory) { return }
	const data_old = Date.now()
	const sentence: Array<string> = tokenizer_sentence.tokenize(context.text.toLowerCase())
	let ans: any = []
    const generator_off = false
	for (const stce in sentence) {
        await context.setActivity();
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
        const sentence_corrected = await Sentence_Corrector_Second(sentence[stce])
        if (sentence_corrected) { 
            ans.push({correct_text: sentence_corrected.qestion, result_text: sentence_corrected.answer, type: "Вопрос-Ответ С коррекцией"})
            continue
        }
        if (generator_off) { continue}
        //Если нифига нет, тогда давайте сами строить, фигли
        const word_list = tokenizer.tokenize(sentence_sel)
        let sentence_build = ''
        for (let j = 0; j < word_list.length; j++) {
            await context.setActivity();
            const word_input = word_list[j]
            let word_sel: string | null = null
            if (!word_input || word_input.length < 1) { continue }
            //смотрим слово в словаре
            const word_check: Dictionary | null = await prisma.dictionary.findFirst({ where: { word: word_input }})
            if (word_check) { 
                word_sel = word_check.word
            } else {
                //иначе правим ошибки
                const word: string | null = await Word_Corrector_Second(word_input)
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
                continue 
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
    if (answer.length > 0) { 
        try {
            if (context.isChat) {
                await context.reply(`${answer}`) 
            } else {
                await context.send(`${answer}`) 
            }
        } catch (e) {
            console.log(`Проблема отправки сообщения в чат: ${e}`)
        }
    }	
    if (generator_off) { return }
    await Message_Education_Module(context)
}
export async function Call_Me_Controller(context: any) {
    try {
        await context.loadMessagePayload();
    } catch (e) {
        console.log(`ВК послал нас нафиг, так и не подгрузив данные о сообщениях: ${e}`)
    }
    //console.log("🚀 ~ file: index.ts:78 ~ vk.updates.on ~ context", context)
    const arr: Array<string> = await tokenizer.tokenize(context.text)
    if (arr && (arr.length < 3 || arr.length > 50) && !context.replyMessage) {
        //console.log("🚀 ~ file: index.ts:81 ~ vk.updates.on ~ context.forwards", context.forwards)
        //console.log('Ответов нет, длина не соотвествует')
        return false;
    }
    //console.log("🚀 ~ file: index.ts:78 ~ vk.updates.on ~ arr", arr.length)
    
    //console.log(context?.forwards)
    if ((context.replyMessage && context.replyMessage.senderId != bot_id) || (context.forwards > 1)) {
        //console.log('Ответ есть, но нее мне')
        //console.log("🚀 ~ file: index.ts:84 ~ vk.updates.on ~ context", context)
        return false;
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
                return false;
            }
        }
    }
    return true
}