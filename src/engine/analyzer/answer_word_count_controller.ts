import { randomInt } from "crypto";
import { tokenizer, vks_info } from "../..";

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
    const ids = vks_info.map((info) => info.idvk);
    const trig = false;
    if (context.replyMessage || (context.forwards && context.forwards.length > 1)) {
        //console.log(`Ответ на сообщение бота. Идентификатор диалога: ${context.replyMessage.peerId}`);
        // Обработка ответа на сообщение бота
        //if ((context.replyMessage && context.replyMessage.senderId != bot_id) || (context.forwards > 1))
        if (( context.replyMessage && ids.includes(Math.abs(context.replyMessage!.senderId)) ) || (context.forwards && context.forwards.length > 1)) {
            //console.log("🚀 ~ file: helper.ts:523 ~ Word_Count_Controller ~ context.replyMessage:", context.replyMessage)
            if (context.text.length < 20 && context.replyMessage.text.length < 20) {
                context.text = await removePunctuationAsync(`${context.text} ${context.replyMessage.text}`)
            } else {
                context.text = await removePunctuationAsync(`${context.text.substring(0, 20)} ${context.replyMessage.text.substring(0, 20)}`)
            }
            return false
            
        }
    }
    // выбираем меньшее из двух значений
    return wordCount.length >= numWords  ? false : true;
}

async function removePunctuationAsync(str?: string): Promise<string> {
    if (str === undefined) {
        return "";
    }
    const cleanedStr = str.replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ");   
    return cleanedStr;
}