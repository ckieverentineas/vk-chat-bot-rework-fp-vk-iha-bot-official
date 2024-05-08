import prisma from "../module/prisma";

export function Sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export async function User_Info(context: any) {
    let [userData] = await context.api.users.get({user_id: context.senderId});
    return userData
}

export async function User_Access(context: any) {
    const user = await prisma.user.findFirst({ where: { idvk: context.senderId } })
    let access = false
    if (user && user.root == true) { access = true }
    return access
}





