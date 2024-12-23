import { User } from "@prisma/client";
import prisma from "../../module/prisma";

export async function User_Say_How_I(context: any) {
    const user: User | null = await prisma.user.findFirst({ where: { idvk: context.senderId } })
    if (user) {
        if (user.say == context.text) {
            if (!user.memorytrg) {
                await context.reply(`Ты уже отправлял это.`)
                const login = await prisma.user.update({ where: { idvk: context.senderId }, data: { say_me: `Ты уже отправлял это.` } })
            }
            const login = await prisma.user.update({ where: { idvk: context.senderId }, data: { memorytrg: true } })
            return true;
        } else {
            const login = await prisma.user.update({ where: { idvk: context.senderId }, data: { say: context.text, memorytrg: false } })
            //console.log(`Пользователь ${login.idvk} не повторяет свой вопрос`)
        }
        if (user.say_me == context.text) {
            if (!user.memorytrg) {
                await context.reply(`Не повторяй за мной.`)
                const login = await prisma.user.update({ where: { idvk: context.senderId }, data: { say_me: `Не повторяй за мной.` } })
            }
            const login = await prisma.user.update({ where: { idvk: context.senderId }, data: { memorytrg: true } })
            return true;
        } else {
            const login = await prisma.user.update({ where: { idvk: context.senderId }, data: { memorytrg: false } })
            //console.log(`Пользователь ${login.idvk} не повторяет за ботом`)
        }
    }
    return false;
}