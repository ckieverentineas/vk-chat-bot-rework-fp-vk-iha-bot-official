import { PrismaClient } from "@prisma/client";
import { HearManager } from "@vk-io/hear";
import { randomInt } from "crypto";
import { send } from "process";
import { Attachment, Context, Keyboard, KeyboardBuilder, PhotoAttachment } from "vk-io";
import { IQuestionMessageContext } from "vk-io-question";
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import { answerTimeLimit, chat_id, prisma, root, timer_text, vk } from '../index';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from "path";
import { readFileSync, promises as fsPromises } from 'fs'

async function Book_Random_String(filename: string) {
    try {
        const contents = await fsPromises.readFile(filename, 'utf-8');
        const arr: any = contents.split(/\r?\n/);
        const clear = await arr.filter((value: any) => value !== undefined && value.length > 5);
        console.log(`Обнаружено количество предложений: ${clear.length}`)
        return clear;
    } catch (err) {
        console.log(err);
    }
}
async function Book_Random_Word(arr_sentence: Array<string>, context: any) {
    try {
        const data_old = Date.now()
        console.log(`Переданно предложений: ${arr_sentence.length}`)
        let count = 0
        let count_circle = 0
        for (const i in arr_sentence) {
            const arr: Array<string> = arr_sentence[i].toLowerCase().replace(/[^а-яА-Я ]/g, "").split(/(?:,| )+/)
            const temp = await arr.filter((value: any) => value !== undefined && value.length >= 1);
            for (let j = 0; j < temp.length-1; j++) {
                const one = temp[j]
                const two = temp[j+1]
                const find_one = await prisma.word_Couple.findFirst({ where: { name_word_first: one, name_word_second: two }})
                if (!find_one) {
                    const create_one = await prisma.word_Couple.create({ data: { name_word_first: one, name_word_second: two }})
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
export function registerUserRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
    hearManager.hear(/обучение/, async (context) => {
        context.send(`Начинаем парсинг книг!`)
        const arr = await Book_Random_String('./src/book/Zhenskaya_baza.txt')
        await Book_Random_Word(arr, context)
    })
}

    