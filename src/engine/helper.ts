import { Answer, Dictionary } from "@prisma/client";
import { root, tokenizer, tokenizer_sentence, vks, vks_info } from "..";
import { randomInt } from "crypto";
import { Auto_Corrector_Natural, Message_Education_Module } from "./parser";
import prisma from "../module/prisma";
import Engine_Generate_Last_Age from "../module/reseacher_parallel";
import { Analyzer_New_Age } from "../module/reseach";
import { MessageContext } from "vk-io";
const getSlug  = require('speakingurl');
const Fuse = require("fuse.js")
const translate = require('secret-package-for-my-own-use');
const {distance, closest} = require('fastest-levenshtein')
export function Sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function* Generator_Word() {
    const batchSize = 10000;
    let cursor: number | undefined = undefined;
    while (true) {
        const words: any = await prisma.dictionary.findMany({
            take: batchSize,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { id: 'asc' },
            include: { First: true, Second: true },
        });
        if (!words.length) break;
        yield words;
        cursor = words[words.length - 1].id;
    }
}
async function* Generator_Sentence() {
    const batchSize = 100000;
    let cursor: number | undefined = undefined;
    while (true) {
        const sentences: any = await prisma.answer.findMany({
            take: batchSize,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { id: 'asc' },
        });
        if (!sentences.length) break;
        yield sentences;
        cursor = sentences[sentences.length - 1].id;
    }
}
export async function Word_Corrector_Second(word: string) {
    const analyzer: Dictionary | null = await prisma.dictionary.findFirst({ where: { word: word } });
    if (analyzer != null) { return word; }
    const generator_word = Generator_Word();
    const options = { includeScore: true, location: 2, threshold: 0.5, distance: 1, ignoreFieldNorm: true, keys: ["word"] };
    const myIndex = Fuse.createIndex(options.keys, await prisma.dictionary.findMany());
    const fuse = new Fuse([], options, myIndex);
    for await (const line of generator_word) {
        const filteredWords = line.filter( (w: any) => w.word.length >= 3 && w.word.length <= 20 );
        if (filteredWords.length > 0) {
            fuse.setCollection(filteredWords);
            const finders = fuse.search(word);
            const finder = finders.filter( (f: any) => f.score <= 0.9 && f.score == finders[0].score );
            if (finder.length > 0) { return finder[0].word; }
        }
    }
    return null;
}
export async function Sentence_Corrector_Second(word: string) {
    const analyzer = await prisma.answer.findFirst({ where: { qestion: word } });
    if (analyzer) { return word; }
    const clear = [];
    for await (const sentences of Generator_Sentence()) {
        const temp = sentences.map((sentence: { qestion: any; }) => sentence.qestion);
        const results = await closest(word, temp);
        if (results) {
            const foundItems = sentences.filter((sentence: any) => sentence.qestion === results);
            clear.push(...foundItems);
        }
    }
    const options = { includeScore: true, location: 2, threshold: 0.5, distance: 3, keys: ['qestion'] };
    const myIndex = Fuse.createIndex(options.keys, clear);
    const fuse = new Fuse(clear, options, myIndex);
    const finders = fuse.search(word);
    const finder = finders.filter((item: any) => item.score <= 0.9 && item.score === finders[0].score);
    if (finders.length >= 1) {
        return await finder?.length > 1 ? finder[randomInt(0, finder.length)].item : finder[0].item
    } else { return null}
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
                await context.send({
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
export async function User_Say(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.senderId } })
    if (user) {
        if (user.say != context.text) {
            const login = await prisma.user.update({ where: { idvk: context.senderId }, data: { say: context.text } })
            console.log(`Пользователь ${login.idvk} не повторяется`)
            return true;
        } else {
            console.log(`Пользователь ${user.idvk} повторяется`)
            return false;
        }
    }
    return true;
}
export async function User_Info(context: any) {
    let [userData] = await context.api.users.get({user_id: context.senderId});
    return userData
}
export async function User_ignore_Check(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.senderId } })
    return user.ignore ? false : true
}
export async function Engine_Answer(context: any, res: { text: string, answer: string, info: string, status: boolean }) {
    await Message_Education_Module(context)
	const data_old = Date.now()
	const sentence: Array<string> = tokenizer_sentence.tokenize(res.text.toLowerCase())
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
        const sentence_corrected: any = await Sentence_Corrector_Second(sentence[stce])
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
                if (!res.text) { console.log(`Получено сообщение: ${res.text}, но ответ не найден`); continue }
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
    res.answer = await ans.map((item: { result_text: any; }) => {return item.result_text;}).join("\r\n")
    res.info = ` Получено сообщение: [${res.text}] \n Исправление ошибок: [${await ans.map((item: { correct_text: any; }) => {return item.correct_text;}).join("\r\n")}] \n Сгенерирован ответ: [${await ans.map((item: { result_text: any; }) => {return item.result_text;}).join(". ")}] \n Затраченно времени: [${(Date.now() - data_old)/1000} сек.] \n Откуда ответ: 	     [${await ans.map((item: { type: any; }) => {return item.type;}).join(" + ")}] \n\n`
    if (res.answer.length > 0) { 
        res.status = true
    }
    return res
}

export async function Engine_Answer_Wall(context: any, regtrg: boolean) {
    await Message_Education_Module(context)
    if (regtrg) { await User_Ignore(context) }
	const bot_memory = await User_Login(context)
	if (!bot_memory) { return }
	const data_old = Date.now()
	const sentence: Array<string> = tokenizer_sentence.tokenize(context.text.toLowerCase())
	let ans: any = []
    const generator_off = false
    
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
        const sentence_corrected: any = await Sentence_Corrector_Second(sentence[stce])
        if (sentence_corrected) { 
            ans.push({correct_text: sentence_corrected.qestion, result_text: sentence_corrected.answer, type: "Вопрос-Ответ С коррекцией"})
            continue
        }
        if (generator_off) { continue}
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
            if (context.isWallComment) {
                await context.api.wall.createComment({owner_id: context.ownerId, post_id: context.objectId, reply_to_comment: context.id, guid: context.text, message: `${answer}`})
            }
        } catch (e) {
            console.log(`Проблема отправки сообщения в чат: ${e}`)
        }
    }	
    
    if (generator_off) { return }
    
}

function extractMentions(text: string): Array<{ id: number, name: string, type: "user" | "club" }> {
    const mentionRegExp = /\[(id|club)(\d+)\|([^\]]+)\]/g;
    const mentions: Array<{ id: number, name: string, type: "user" | "club" }> = [];
    let match;
    while ((match = mentionRegExp.exec(text)) !== null) {
      const type = match[1] === "id" ? "user" : "club";
      const id = parseInt(match[2]);
      const name = match[3];
      mentions.push({ id: id, name: name, type: type });
    }
    return mentions;
  }
  
  export async function Call_Me_Controller(text: string): Promise<boolean> {
    const mentions = extractMentions(text);
    if (mentions.length === 0) {
      //console.log("Упоминаний не найдено");
      return false;
    }
  
    const ids = vks_info.map((info) => info.idvk);
    for (const mention of mentions) {
      if (ids.includes(mention.id)) {
        //console.log(`Нас упомянули: ${mention.id}`);
        return false;
      }
    }
  
    //console.log("Нас никто не упомянул, вернется false для продолжения");
    return true;
  }

export async function Direct_Search(res: { text: string, answer: string, info: string, status: boolean}) {
    const data_old = Date.now()
    const analyzer: Answer | undefined | null = await prisma.answer.findFirst({ where: { qestion: res.text } });
    if (analyzer) {
        res.answer = analyzer.answer
        res.info = ` Получено сообщение: [${res.text}] \n Исправление ошибок: [${analyzer.qestion}] \n Сгенерирован ответ: [${analyzer.answer}] \n Затраченно времени: [${(Date.now() - data_old)/1000} сек.] \n Откуда ответ: 	     [${"DirectBoost"}] \n\n`
        res.status = true
    }
    return res
}

export async function Answer_Core_Edition(res: { text: string, answer: string, info: string, status: boolean }, context: any) {
	res = await Direct_Search(res)
	console.log(`DirectBoost ${res.status ? "{X}" : "{V}"} ${context.senderId} --> ${context.text} <-- ${res.status ? "{Success}" : "{NotFound}"}`)
	res = !res.status ? await Engine_Generate_Last_Age(res) : res
	console.log(`MultiBoost  ${res.status ? "{X}" : "{V}"} ${context.senderId} --> ${context.text} <-- ${res.status ? "{Success}" : "{NotFound}"}`)
	res = !res.status ? await Analyzer_New_Age(res) : res
	console.log(`SpeedBoost  ${res.status ? "{X}" : "{V}"} ${context.senderId} --> ${context.text} <-- ${res.status ? "{Success}" : "{NotFound}"}`)
	res = !res.status ? await Engine_Answer(context, res) : res
	console.log(`LongDepth   ${res.status ? "{X}" : "{V}"} ${context.senderId} --> ${context.text} <-- ${res.status ? "{Success}" : "{NotFound}"}`)
    return res
}

export async function Re_Answer_controller(context: MessageContext): Promise<boolean> {
    const ids = vks_info.map((info) => info.idvk);
    try {
        await context.loadMessagePayload();
    } catch (e) {
        console.log(`ВК послал нас нафиг, так и не подгрузив данные о сообщениях: ${e}`)
    }
    if (context.replyMessage || (context.forwards && context.forwards.length > 1)) {
        //console.log(`Ответ на сообщение бота. Идентификатор диалога: ${context.replyMessage.peerId}`);
        // Обработка ответа на сообщение бота
        //if ((context.replyMessage && context.replyMessage.senderId != bot_id) || (context.forwards > 1))
        if ( ( context.replyMessage && !ids.includes(Math.abs(context.replyMessage!.senderId)) ) || (context.forwards && context.forwards.length > 1)) {
            return true
        } else {
            //console.log(`Ответ на сообщение другого пользователя. Идентификатор диалога: ${context.replyMessage?.peerId}`);
            // Обработка ответа на сообщение другого пользователя
            return false
        }
    }
    return false
}

export async function Word_Count_Controller(context: any): Promise<boolean> {
    let text = context.text
    if (!text || text.length === 0) {
        return true;
    }
    // проверяем, можно ли привести текст к нижнему регистру
    const canLowerCase = /[A-ZА-Я]/.test(text);
    if (canLowerCase) {
        // приводим текст к нижнему регистру
        text = text.toLowerCase();
    }
    const wordCount = tokenizer.tokenize(text);
     // задаем вероятности для каждого значения числа слов
    const probabilities = [0.05, 0.1, 0.35, 0.5];

    // создаем список границ для каждого значения числа слов
    const borders: any = probabilities.reduce((acc: any, curr, index) => {
        if (index === 0) { acc.push(curr); } else { acc.push(acc[index - 1] + curr); }
        return acc;
    }, []);
    // рандомизируем число слов в соответствии с заданными вероятностями
    const randomNum = Math.random();
    const numWords = borders.findIndex((border: number) => randomNum < border) + 1;
    if (typeof context.text === 'string' && context.text.length >= randomInt(200, 250)) { 
        context.text = context.text.substring(0, randomInt(150, 200));
    }

    // выбираем меньшее из двух значений
    return wordCount.length >= numWords  ? false : true;
}