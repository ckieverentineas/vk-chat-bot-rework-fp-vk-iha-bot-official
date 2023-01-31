import { Answer, Dictionary } from "@prisma/client";
import { prisma, vk } from "..";
import { NounInflector } from "natural";
const Fuse = require("fuse.js")

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
    let myCursor: number | undefined | null = firstQueryResults[firstQueryResults.length-1].id || undefined
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
        for (const i in finder) { clear = [...clear, ...finder.slice(0, 10)] }
        await generator_word.next()
    }
    return await clear.length >= 1 ? clear[0].item.word : false
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
        for (const i in finder) { clear = [...clear, ...finder.slice(0, 10)] }
        await generator_sentence.next()
    }
    return await clear.length >= 1 ? clear[0].item.qestion : false
}
export async function deleteDuplicate(a: any){a=a.toString().replace(/ /g,",");a=a.replace(/[ ]/g,"").split(",");for(var b: any =[],c=0;c<a.length;c++)-1==b.indexOf(a[c])&&b.push(a[c]);b=b.join(", ");return b=b.replace(/,/g," ")};

export async function User_Registration(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.senderId } })
    if (!user) {
        const registration = await prisma.user.create({ data: { idvk: context.senderId}})
        console.log(`Зарегестрирован новый пользователь: ${registration.idvk}`)
        return false
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
            await context.send(user.warning == 0 ? `⚠ Внимание: \n Уважаемый @id${context.senderId}(${info.first_name}), не отправляйте сообщения настолько часто.` : `⛔ Последнее предупреждение: \n Уважаемый @id${context.senderId}(${info.first_name}), не спамьте, а то будете проигнорированы в дальнейшем.`)
            console.log(`Пользователь добавлен в лист игнора: ${login.idvk}`)
        } else {
            const login = await prisma.user.update({ where: { idvk: context.senderId }, data: { ignore: user.ignore ? false : true, warning: 0 } })
            await context.send(`🛡 Уведомление от системы защиты: \n Пользователь @id${context.senderId}(${info.first_name}), ваш idvk ${context.senderId} добавлен в лист игнора.`)
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