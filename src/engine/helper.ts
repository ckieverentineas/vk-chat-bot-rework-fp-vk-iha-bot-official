import { Answer, Dictionary } from "@prisma/client";
import { prisma, tokenizer, tokenizer_sentence, vk } from "..";
import { NounInflector } from "natural";
import { randomInt } from "crypto";
const Fuse = require("fuse.js")
const translate = require('secret-package-for-my-own-use');

async function* Generator_Word() {
    const limiter = 10000
    const firstQueryResults: Dictionary[] | null = await prisma.dictionary.findMany({ take: limiter, orderBy: { id: 'asc' } })
    const max: Dictionary | null = await prisma.dictionary.findFirst({ take: limiter, orderBy: { id: 'desc' } })
    yield firstQueryResults
    let myCursor: number | undefined = firstQueryResults[firstQueryResults.length-1].id
    while (myCursor != null && max != null && myCursor <= max.id && myCursor != undefined) {
        const nextQueryResults: Dictionary[] | null = await prisma.dictionary.findMany({ take: limiter, skip: 1, cursor: { id: myCursor },orderBy: { id: 'asc' } })
        yield nextQueryResults
        myCursor = nextQueryResults[nextQueryResults.length-1]?.id 
    }
}
async function* Generator_Sentence() {
    const limiter = 10000
    const firstQueryResults: Answer[] | null = await prisma.answer.findMany({ take: limiter, orderBy: { id: 'asc' } })
    const max: Answer | null = await prisma.answer.findFirst({ take: limiter, orderBy: { id: 'desc' } })
    yield firstQueryResults
    let myCursor: number | undefined | null = firstQueryResults[firstQueryResults.length-1]?.id || undefined
    while (myCursor && max != null && myCursor <= max.id) {
        const nextQueryResults: Answer[] | null = await prisma.answer.findMany({ take: limiter, skip: 1, cursor: { id: myCursor },orderBy: { id: 'asc' } })
        yield nextQueryResults
        myCursor = nextQueryResults[nextQueryResults.length-1]?.id 
    }
}
export async function Word_Corrector(word:string) {
	const analyzer: Dictionary | null = await prisma.dictionary.findFirst({ where: { word: word } })
    if (analyzer != null) { return word }
    let generator_word: any = Generator_Word();
    const options = { includeScore: true, location: 2, threshold: 0.5, distance: 1, ignoreFieldNorm: true, keys: ['word'] }
    let clear: any = []
    for await (const line of generator_word) {
        const fuse = new Fuse(line, options)
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
        const fuse = new Fuse(line, options)
        const finder = await fuse.search(word)
        for (const i in finder) { if (finder[i].score < 0.5) { clear.push(finder[i]) } }
        await generator_sentence.next()
    }
    //console.log(`тексто до ${clear.length} ${JSON.stringify(clear.slice(0, 3))}`)
    await clear.sort(function(a:any, b:any) {return a.score - b.score}).slice(0, 10)
    //console.log(`текст после ${clear.length} ${JSON.stringify(clear.slice(0, 3))}`)
    return await clear ? clear.length > 1 ? clear[randomInt(0, clear.length)].item : clear[0]?.item : null
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
            await context.send(`🛡 Уведомление от системы памяти: \n ${user.last.length != '' ? `Вы мне уже писали ранее: ${user.last}` : '' } \n ${user.lastlast.length != '' ? `Как-то невзначай отправляли: ${user.lastlast}` : '' }.`)
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
        const sentence_corrected = await Sentence_Corrector(sentence[stce])
        if (sentence_corrected) { 
            ans.push({correct_text: sentence_corrected.qestion, result_text: sentence_corrected.answer, type: "Вопрос-Ответ С коррекцией"})
            continue
        }
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
}