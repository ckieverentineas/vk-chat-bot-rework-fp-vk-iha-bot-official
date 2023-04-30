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







