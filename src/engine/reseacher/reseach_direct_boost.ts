import { Answer } from "@prisma/client";
import prisma from "../../module/prisma";

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