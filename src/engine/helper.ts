import prisma from "../module/prisma";

export function Sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export async function User_Registration(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.senderId } })
    if (!user) {
        try {
            const registration = await prisma.user.create({ data: { idvk: context.senderId}})
            console.log(`Зарегестрирован новый пользователь: ${registration.idvk}`)
            return false
        } catch (e) {
            console.log(`Возникла ошибка регистрации клиента: ${e}`)
        }
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
            //await context.send(`🛡 Уведомление от системы памяти: \n ${user.last.length != '' ? `Вы мне уже писали ранее: ${user.last}` : '' } \n ${user.lastlast.length != '' ? `Как-то невзначай отправляли: ${user.lastlast}` : '' }.`)
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
            await context.send(user.warning == 0 ? `@id${context.senderId}(${info.first_name}), не отправляйте сообщения настолько часто.` : `@id${context.senderId}(${info.first_name}), не спамьте, а то будете проигнорированы в дальнейшем.`)
            console.log(`Пользователь добавлен в лист игнора: ${login.idvk}`)
        } else {
            const login = await prisma.user.update({ where: { idvk: context.senderId }, data: { ignore: user.ignore ? false : true, warning: 0 } })
            await context.send(`@id${context.senderId}(${info.first_name}), c idvk ${context.senderId} я с тобой больше не разговариваю.`)
            console.log(`Пользователь добавлен в лист игнора: ${login.idvk}`)
        }
    }
}
export async function User_Say(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.senderId } })
    if (user) {
        if (user.say != context.text) {
            const login = await prisma.user.update({ where: { idvk: context.senderId }, data: { say: context.text } })
            console.log(`Пользователь ${login.idvk} не повторяется`)
            return true;
        } else {
            console.log(`Пользователь ${user.idvk} повторяется`)
            return false;
        }
    }
    return true;
}
export async function User_Info(context: any) {
    let [userData] = await context.api.users.get({user_id: context.senderId});
    return userData
}
export async function User_ignore_Check(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.senderId } })
    return user.ignore ? false : true
}







