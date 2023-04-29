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



export async function User_Info(context: any) {
    let [userData] = await context.api.users.get({user_id: context.senderId});
    return userData
}
export async function User_ignore_Check(context: any) {
    const user: any = await prisma.user.findFirst({ where: { idvk: context.senderId } })
    return user.ignore ? true : false
}







