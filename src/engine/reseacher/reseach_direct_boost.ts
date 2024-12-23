import prisma from "../../module/prisma";

export async function Direct_Search(res: { text: string, answer: string, info: string, status: boolean}, data_old: number) {
    const question = await prisma.question.findUnique({
      where: { text: res.text },
      include: { answers: true },
    });
    if (question) {
      const answer = question.answers[Math.floor(Math.random() * question.answers.length)];
      res.answer = answer.answer;
      res.info = ` Получено сообщение: [${res.text}] \n Исправление ошибок: [${question.text}] \n Сгенерирован ответ: [${answer.answer}] \n Затраченно времени: [${(Date.now() - data_old)/1000} сек.] \n Откуда ответ: [${"DirectBoost"}] \n\n`;
      res.status = true;
    }
    return res;
  }