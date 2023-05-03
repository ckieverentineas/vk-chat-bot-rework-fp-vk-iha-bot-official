import { tokenizer, tokenizer_sentence } from "../..";
import { JaroWinklerDistance, DamerauLevenshteinDistance } from "natural";
import prisma from "../../module/prisma";
import { findBestMatch } from "string-similarity";
import { distance as levenshteinDistance } from 'fastest-levenshtein';
import { compareTwoStrings } from 'string-similarity';
import { Question } from "@prisma/client";
import { MessageContext } from "vk-io";

// Функция для токенизации текста
async function tokenizeText(text: string): Promise<string[]> {
    return await tokenizer_sentence.tokenize(text.toLowerCase()) || [];
}
// Асинхронный генератор для извлечения вопросов из базы данных порциями
async function* Generator_Sentence(): AsyncGenerator<Question[]> {
    const batchSize = 100000;
    let cursor: number | undefined = undefined;
    while (true) {
        // Извлекаем порцию вопросов из базы данных
        const questions: Question[] = await prisma.$queryRaw<Question[]>`
            SELECT * FROM Question
            WHERE id > ${cursor ?? 0}
            ORDER BY id ASC
            LIMIT ${batchSize}
        `;
        if (!questions.length) break;
        // Возвращаем порцию вопросов через yield
        yield questions;
        // Обновляем курсор для извлечения следующей порции вопросов
        cursor = questions[questions.length - 1].id;
    }
}
// Интерфейс для объекта с результатом сравнения
interface Match {
    query_question: string;
    sentence_question: { question: Question, score: number }[];
}
// Функция для поиска наилучшего совпадения для каждого предложения в query в массиве вопросов sentences
async function findClosestMatch(query: string[], sentences: Question[]): Promise<Match[]> {
    const matches: Match[] = [];
    await Promise.all(query.map(async (query_question) => {
        const sentence_question: { question: Question; score: number }[] = (await Promise.all(sentences.map(async (sentence) => {
            const jaroWinklerScore = JaroWinklerDistance(query_question, sentence.text, {});
            const levenshteinScore = 1 / (levenshteinDistance(query_question, sentence.text) + 1);
            const cosineScore = compareTwoStrings(query_question, sentence.text);
            const score = (jaroWinklerScore + levenshteinScore + cosineScore) / 3;
            if (score >= 0.3) {
            return { question: sentence, score };
            }
            return undefined;
        }))).filter((q): q is { question: Question; score: number } => q !== undefined);
            matches.push({ query_question, sentence_question });
        }));
    return matches;
}

async function Reseacher_New_Format(res: { text: string, answer: string, info: string, status: boolean }, context: MessageContext, data_old: number) {
    const sentence_array = await tokenizeText(context.text!);
    const matchGenerator = Generator_Sentence();
    let result: Match[] = [];
    for await (const sentences of matchGenerator) {
        const matches = await findClosestMatch(sentence_array, sentences);
        result = result.concat(matches);
    }
    const output: Match[] = result.reduce((acc: Match[], item: Match) => {
        const existingItem = acc.find(obj => obj.query_question === item.query_question);
        if (existingItem) {
            existingItem.sentence_question.push(...item.sentence_question.filter((q: any) => !existingItem.sentence_question.some((eq: any) => eq.id === q.id)));
        } else {
            acc.push({ query_question: item.query_question, sentence_question: item.sentence_question });
        }
        return acc;
    }, []);
    output.map((match) => ({
        ...match,
        sentence_question: match.sentence_question.sort((a, b) => b.score - a.score),
    }));
    res = await processInputData(res, output, data_old)
    //console.log(JSON.stringify(output, null, 2));
    return res
}

// Определяем функцию для обработки входных данных
async function processInputData(res: { text: string, answer: string, info: string, status: boolean }, data: Match[], data_old: number) {
    const answers = []
    for (const obj of data) {
        if (obj.sentence_question.length > 0) {
            const answer = await prisma.answer.findMany({
            where: { id_question: obj.sentence_question[0].question.id },
            take: 100,
            })
            if (answer.length > 0) {
                const randomIndex: number = Math.floor(Math.random() * answer.length)
                answers.push({ id: answer[randomIndex].id, input: obj.query_question, qestion: obj.sentence_question[0].question.text, answer: answer[randomIndex].answer, crdate: new Date(answer[randomIndex].crdate) });
            }
        }
    }
    if (answers.length > 0) {
        res.answer =  answers.length == 1 ? answers.map(answer => `${answer.answer}\n\n`).join('') : answers.map(answer => `${answer.input}: \n${answer.answer}\n\n`).join('')
        res.info = ` Получено сообщение: [${res.text}] \n Исправление ошибок: [${answers.map(answer => `${answer.id} --> ${answer.qestion}`).join(' ')}] \n Сгенерирован ответ: [${answers.map(answer => `${answer.id} <-- ${answer.answer}`).join(' ')}] \n Затраченно времени: [${(Date.now() - data_old)/1000} сек.] \n Откуда ответ: 	     [${"MultiBoost~"}] \n\n`
        res.status = true
    }
    return res
}


export default Reseacher_New_Format;