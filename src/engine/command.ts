import { HearManager } from "@vk-io/hear";
import { IQuestionMessageContext } from "vk-io-question";
import { root } from "..";
const rq = require("prequest");

export function registerCommandRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
    hearManager.hear(/!погода/, async (context) => {
        if (context.isOutbox == false && context.senderId == root && context?.text != undefined) {
            const match = context.text.match(/^(?:!погода|!weather)\s?(.*)/i);

            // Проверяем, что match и match[1] существуют
            if (!match || !match[1] || match[1].toLowerCase() === "") {
                return context.send(`nope`);
            }

            // Запрос к API погоды
            rq(`http://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(match[1])}&lang=ru&units=metric&appid=5d8820e4be0b3f1818880ef51406c9ee`)
                .then((res: any) => {
                    const Utils = {
                        filter: (text: string) => {
                            text = text.replace(/^(RU)/i, 'Россия')
                                       .replace(/^(UA)/i, 'Украина')
                                       .replace(/^(BY)/i, 'Беларусь')
                                       .replace(/^(US)/i, 'США')
                                       .replace(/^(KZ)/i, 'Казахстан')
                                       .replace(/^(CN)/i, 'Китай')
                                       .replace(/^(GB)/i, 'Англия')
                                       .replace(/^(AE)/i, 'Объединенные Арабские Эмираты')
                                       .replace(/^(AQ)/i, 'Антарктида')
                                       .replace(/^(stations)/i, 'станция');
                            return text;
                        }
                    };

                    const TempTo = () => {
                        if (res.main.temp < -10) return 'очень холодно';
                        if (res.main.temp < -5) return 'холодно';
                        if (res.main.temp < 5) return 'холодновато';
                        if (res.main.temp < 20) return 'комфортно';
                        if (res.main.temp < 25) return 'тепло';
                        if (res.main.temp < 30) return 'жарко';
                        return 'Очень жарко';
                    };

                    const Timer = () => {
                        const now = new Date(res.dt * 1000).getHours();
                        if (now > 18) return '🌆';
                        if (now > 22) return '🌃';
                        if (now > 0) return '🌃';
                        if (now < 6) return '🌅';
                        return '🏞';
                    };

                    const sunrise = new Date(res.sys.sunrise * 1000);
                    const sunset = new Date(res.sys.sunset * 1000);

                    const sunmin = () => {
                        return sunrise.getMinutes() < 10 ? `0${sunrise.getMinutes()}` : sunrise.getMinutes();
                    };

                    const sunsmin = () => {
                        return sunset.getMinutes() < 10 ? `0${sunset.getMinutes()}` : sunset.getMinutes();
                    };

                    const date = new Date(res.dt * 1000);
                    const daterh = () => {
                        return date.getHours() < 10 ? `0${date.getHours() + 3}` : date.getHours() + 3;
                    };

                    const daterm = () => {
                        return date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
                    };

                    context.reply(`${Timer()} ${res.name}, ${Utils.filter(res.sys.country)}
                    
                    ➖ Погода: ${res.weather[0].description}, ${res.weather[0].main}
                    ➖ база: ${Utils.filter(res.base)}
                    ➖ Сейчас там ${TempTo()}: ${res.main.temp}°C
                    ➖ Рассвет: ${sunrise.getHours() + res.timezone / 3600}:${sunmin()} (Местного времени)
                    ➖ Закат: ${sunset.getHours() + res.timezone / 3600}:${sunsmin()} (Местного времени)
                    ➖ Скорость ветра: ${res.wind.speed} м/с
                    ➖ направление ветра: ${res.wind.deg}°
                    ➖ максимальная температура: ${res.main.temp_max}°C
                    ➖ влажность: ${res.main.humidity}%
                    ➖ облачность: ${res.clouds.all}%
                    ➖ Давление: ${Math.floor(res.main.pressure / 1.33333)} мм рт. ст.
                    ➖ минимальная температура: ${res.main.temp_min}°C
                    ➖ сдвиг времени в часах от UTC: ${res.timezone / 3600}`);
                })
                .catch((error: any) => {
                    context.reply(`город не найден`);
                });
        }
    });
}
