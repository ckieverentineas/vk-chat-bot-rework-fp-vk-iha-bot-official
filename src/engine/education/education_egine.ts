import { Unknown } from "@prisma/client";
import prisma from "../../module/prisma";
import { JaroWinklerDistance, DamerauLevenshteinDistance } from "natural";
import { distance as levenshteinDistance } from 'fastest-levenshtein';
import { compareTwoStrings } from 'string-similarity';
import { MessageContext } from "vk-io";

export async function Education_Engine(text: string): Promise<void>{
    
}

export async function Add_Unknown(text: string): Promise<Unknown | false> {
    const batchSize = 100000;
    let cursor: number | undefined = undefined;

    while (true) {
        const unknownQuestions: Unknown[] = await prisma.$queryRaw<Unknown[]>`
            SELECT * FROM Unknown
            WHERE id > ${cursor ?? 0}
            ORDER BY id ASC
            LIMIT ${batchSize}
        `;

        if (!unknownQuestions.length) break;

        for (const unknownQuestion of unknownQuestions) {
            const cosineScore = compareTwoStrings(text, unknownQuestion.text,);
            if (cosineScore >= 0.8) {
                return false;
            }

            // Обновляем курсор для извлечения следующей порции вопросов
            cursor = unknownQuestion.id;
        }
    }

    // Если похожих записей не найдено, добавляем новую запись в таблицу Unknown
    const res = await prisma.unknown.create({ data: { text } });
    return res
}