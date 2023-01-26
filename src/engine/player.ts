import { PrismaClient } from "@prisma/client";
import { HearManager } from "@vk-io/hear";
import { randomInt } from "crypto";
import { send } from "process";
import { Attachment, Context, Keyboard, KeyboardBuilder, PhotoAttachment } from "vk-io";
import { IQuestionMessageContext } from "vk-io-question";
import * as xlsx from 'xlsx';
import { promises as fs } from 'fs'
import { answerTimeLimit, chat_id, prisma, root, timer_text, tokenizer, tokenizer_sentence, vk } from '../index';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from "path";
import { readFileSync, promises as fsPromises } from 'fs'
import { COPYFILE_EXCL } from "constants";

async function Book_Random_String(filename: string) {
    try {
        const contents = await fsPromises.readFile(filename, 'utf-8');
        const arr: Array<string> = await tokenizer_sentence.tokenize(contents)
        //const arr: any = contents.split(/\r?\n/);
        const clear = arr.filter((value: any) => value !== undefined && value.length > 5);
        console.log(`Обнаружено количество предложений: ${clear.length}`)
        return clear;
    } catch (err) {
        console.log(err);
    }
}
async function Book_Random_Word(arr_sentence: Array<string>, context: any, name_book: string) {
    try {
        const data_old = Date.now()
        console.log(`Переданно предложений: ${arr_sentence.length}`)
        let count = 0
        let count_circle = 0
        for (const i in arr_sentence) {
            const arr: Array<string> = await tokenizer.tokenize(arr_sentence[i])
            //const arr: Array<string> = await Az.Tokens(arr_sentence[i]).done();
            //const arr: Array<string> = arr_sentence[i].toLowerCase().replace(/[^а-яА-Я ]/g, "").split(/(?:,| )+/)
            const temp = arr.filter((value: any) => value !== undefined && value.length > 0);
            for (let j = 0; j < temp.length-1; j++) {
                const word1 = temp[j].toLowerCase()
                const word2 = temp[j+1].toLowerCase()
                try {
                    const first: any = await prisma.dictionary.findFirst({ where: { word: word1 }, select: {id: true}})
                    const second: any = await prisma.dictionary.findFirst({ where: { word: word2 }, select: {id: true}})
                    if (first && second) {
                        const check: any = await prisma.couple.findFirst({ where: { id_first: first.id, id_second: second.id, position: j } })
                        if (check) {
                            await prisma.couple.update({ where: { id: check.id }, data: { score: {increment: 1} } })
                        } else {
                            const create = await prisma.couple.create({ data: { id_first: first.id, id_second: second.id, position: j }})
                            console.log(`Set couple: ${create.id_first}-${word1} > ${create.id_second}-${word2}`)
                            count++
                        }
                    }
                } catch (err) {
                    console.log(`Ошибка ${err}`)
                }
                
                count_circle++
            }
        }
        console.log(`Read couple: ${count_circle}, Set new couple: ${count}`)
        await context.send(`✅ Книга связей: ${name_book} Найдено пар: ${count_circle}, Сохраненено пар: ${count} Затраченно времени: ${(Date.now() - data_old)/1000} сек.`)
    } catch (err) {
        console.log(err);
    }
}
async function Book_Random_Dictionary(arr_sentence: Array<string>, context: any, name_book: string) {
    try {
        const data_old = Date.now()
        console.log(`Переданно предложений: ${arr_sentence.length}`)
        let count = 0
        let count_circle = 0
        for (const i in arr_sentence) {
            const arr: Array<string> = tokenizer.tokenize(arr_sentence[i])
            //const arr: Array<string> = await Az.Tokens(arr_sentence[i]).done();
            //const arr: Array<string> = arr_sentence[i].toLowerCase().replace(/[^а-яА-Я ]/g, "").split(/(?:,| )+/)
            const temp = arr.filter((value: any) => value !== undefined && value.length > 0);
            for (let j = 0; j < temp.length-1; j++) {
                const one = temp[j].toLowerCase()
                try {
                    if (!one) {continue}
                    const find_one = await prisma.dictionary.findFirst({ where: { word: one }})
                    if (find_one) {
                        await prisma.dictionary.update({ where: { word: one }, data: { score: {increment: 1} } })
                    } else {
                        const create_one = await prisma.dictionary.create({ data: { word: one }})
                        console.log(`Add word: ${create_one.id}-${create_one.word}`)
                        count++
                    }
                } catch (err) {
                    console.log(`Ошибка добавления нового слова ${err}`)
                }
                count_circle++
            }
        }
        console.log(`Read words: ${count_circle}, Add words: ${count}`)
        await context.send(`✅ Книга слов: ${name_book} Найдено слов: ${count_circle}, Сохраненно слов: ${count} Затраченно времени: ${(Date.now() - data_old)/1000} сек.`)
    } catch (err) {
        console.log(err);
    }
}
async function Move_Book(dir:string, file:string) {
    await fs.copyFile(`${dir}/${file}`, `${dir}/done/${file}`, COPYFILE_EXCL)
    await fs.unlink(`${dir}/${file}`)
}
async function readDir(path: string) {
    try { const files = await fs.readdir(path); return files } catch (err) { console.error(err); }
}
async function MultipleReader(dir:string, file:string, context: any) {
    const arr: Array<string> = await Book_Random_String(`${dir}/${file}`) || []
    await context.send(`Изучаем книгу: ${file}, строк: ${arr.length}`)
    await Book_Random_Word(arr, context, file)
}
async function MultipleReaderDictionary(dir:string, file:string, context: any) {
    const arr: Array<string> = await Book_Random_String(`${dir}/${file}`) || []
    await context.send(`Создаем словарь: ${file}, строк: ${arr.length}`)
    await Book_Random_Dictionary(arr, context, file)
}
export function registerUserRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
    hearManager.hear(/обучение/, async (context) => {
        if (context.isOutbox == false && context.senderId == root) {
            const dir = `./src/book`
            const file_name: any = await readDir(dir)
            for (const file of file_name) {
                await MultipleReader(dir, file, context)
            }
        }
    })
    hearManager.hear(/словарь/, async (context) => {
        if (context.isOutbox == false && context.senderId == root) {
            const dir = `./src/book`
            const file_name: any = await readDir(dir)
            for (const file of file_name) {
                await MultipleReaderDictionary(dir, file, context)
            }
        }
    })
}


    