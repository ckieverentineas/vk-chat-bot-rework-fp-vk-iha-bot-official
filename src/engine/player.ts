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


async function Book_Random_String(filename: string) {
    try {
        const contents = await fsPromises.readFile(filename, 'utf-8');
        const arr: Array<string> = tokenizer_sentence.tokenize(contents)
        //const arr: any = contents.split(/\r?\n/);
        const clear = await arr.filter((value: any) => value !== undefined && value.length > 5);
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
            const arr: Array<string> = tokenizer.tokenize(arr_sentence[i])
            //const arr: Array<string> = await Az.Tokens(arr_sentence[i]).done();
            //const arr: Array<string> = arr_sentence[i].toLowerCase().replace(/[^а-яА-Я ]/g, "").split(/(?:,| )+/)
            const temp = await arr.filter((value: any) => value !== undefined && value.length > 0);
            for (let j = 0; j < temp.length-1; j++) {
                const one = temp[j].toLowerCase()
                const two = temp[j+1].toLowerCase()
                try {
                    const find_one = await prisma.word_Couple.findFirst({ where: { name_word_first: one, name_word_second: two }})
                    if (!find_one) {
                        const create_one = await prisma.word_Couple.create({ data: { name_word_first: one, name_word_second: two }})
                        console.log(`Add new couple: ${create_one.name_word_first} > ${create_one.name_word_second}`)
                        count++
                    }
                } catch {
                    console.log(`Ошибка`)
                }
                
                count_circle++
            }
        }
        console.log(`Обработано пар: ${count_circle}, Добавлено пар: ${count}`)
        context.send(`Книга: ${name_book} Обработано пар: ${count_circle}, Добавлено пар: ${count} Затраченно времени: ${(Date.now() - data_old)/1000} сек.`)
    } catch (err) {
        console.log(err);
    }
}
async function Book_Random_Analyze(arr_sentence: Array<string>, context: any) {
    try {
        const data_old = Date.now()
        console.log(`Переданно предложений: ${arr_sentence.length}`)
        let count = 0
        let count_circle = 0
        for (const i in arr_sentence) {
            const temp: Array<string> = arr_sentence[i].split(/(?:,| )+/)
            for (let j = 0; j < temp.length-1; j++) {
                const find_one = await prisma.word_Couple.findFirst({ where: { name_word_first: temp[j], name_word_second: temp[j+1] }})
                if (!find_one) {
                    const create_one = await prisma.word_Couple.create({ data: { name_word_first: temp[j], name_word_second: temp[j+1] }})
                    console.log(`Add new couple: ${create_one.name_word_first} > ${create_one.name_word_second}`)
                    count++
                }
                count_circle++
            }
        }
        console.log(`Обработано пар: ${count_circle}, Добавлено пар: ${count}`)
        context.send(`Обработано пар: ${count_circle}, Добавлено пар: ${count} Затраченно времени: ${(Date.now() - data_old)/1000} сек.`)
    } catch (err) {
        console.log(err);
    }
}
async function readDir(path: string) {
    try { const files = await fs.readdir(path); return files } catch (err) { console.error(err); }
}
async function MultipleReader(dir:string, file:string, context: any) {
    const arr = await Book_Random_String(`${dir}/${file}`)
    context.send(`Изучаем книгу: ${file}, строк: ${arr.length}`)
    await Book_Random_Word(arr, context, file)
}
export function registerUserRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
    hearManager.hear(/обучение/, async (context) => {
        const dir = `./src/book`
        const file_name: any = await readDir(dir)
        console.log("🚀 ~ file: player.ts:90 ~ hearManager.hear ~ file_name", file_name)
        for (const file of file_name) {
            MultipleReader(dir, file, context)
        }
        
    })
}

    