import { starting_date, vks, vks_info } from "..";

export async function updateStatuses() {
    for (let i = 0; i < vks.length; i++) {
        const vk = vks[i];
        const info = vks_info[i];
        try {
            if (info.type === 'page') {
            await vk.api.status.set({
                text: `${await Up_Time()}`
            });
            console.log(`Статус ${info.type} с ID ${info.idvk} изменен`);
            } else if (info.type === 'group') {
                /*
                await vk.api.status.set({
                    group_id: info.idvk,
                    status: `${await Up_Time()}`
                })
                console.log(`Статус группы с ID ${info.idvk} изменен`);
                */
            }
        } catch (error) {
            console.error(`Ошибка при изменении статуса с ID ${info.idvk} и типом сущности ${info.type}:`, error);
        }
    }
}
async function Up_Time() {
    const now = new Date();
    const diff = now.getTime() - starting_date.getTime();
    const timeUnits = [
        { unit: "дней", value: Math.floor(diff / 1000 / 60 / 60 / 24) },
        { unit: "часов", value: Math.floor((diff / 1000 / 60 / 60) % 24) },
        { unit: "минут", value: Math.floor((diff / 1000 / 60) % 60) },
        { unit: "секунд", value: Math.floor((diff / 1000) % 60) },
    ];
    return `Время работы: ${timeUnits.filter(({ value }) => value > 0).map(({ unit, value }) => `${value} ${unit}`).join(" ")}`
}