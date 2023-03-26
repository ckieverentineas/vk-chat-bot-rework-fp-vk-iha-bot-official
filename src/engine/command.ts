import { HearManager } from "@vk-io/hear";
import { IQuestionMessageContext } from "vk-io-question";
const rq = require("prequest");
export function registerCommandRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
    /*hearManager.hear(/!погода/, async (context) => {
        if (context.isOutbox == false && context.senderId == root && context?.text != undefined) {
            let match = context.text.match(/^(?:!погода|!weather)\s?(.*)/i);
            if(match[1].toLowerCase() == "") return context.send(`nope`)
            rq("http://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(match[1]) + "&lang=ru&units=metric&appid=5d8820e4be0b3f1818880ef51406c9ee")
            .then((res) => {
            let Utils = {
            filter: (text) => {
            text = text.replace(/^(RU)/i, 'Россия')
            text = text.replace(/^(UA)/i, 'Украина')
            text = text.replace(/^(BY)/i, 'Беларусь')
            text = text.replace(/^(US)/i, 'США')
            text = text.replace(/^(KZ)/i, 'Казахстан')
            text = text.replace(/^(CN)/i, 'Китай')
            text = text.replace(/^(CN)/i, 'Китай')
            text = text.replace(/^(GB)/i, 'Англия')
            text = text.replace(/^(AE)/i, 'Объединенные Арабские Эмираты')
            text = text.replace(/^(AQ)/i, 'Антарктида')
            text = text.replace(/^(stations)/i, 'станция')
            return text;
            }};
            function TempTo () {
            if(res.main.temp < -10) return 'очень холодно'
            else if(res.main.temp < -5) return 'холодно'
            else if(res.main.temp < 5) return 'холодновато'
            else if(res.main.temp < 20) return 'комфортно'
            else if(res.main.temp < 25) return 'тепло'
            else if(res.main.temp < 30) return 'жарко'
            else if(res.main.temp < 50) return 'Очень жарко'
            };
            function Timer () {
            let now = new Date(res.dt*1000).getHours();
            if(now > 18) return '🌆'
            else if(now > 22) return '🌃'
            else if(now > 0) return '🌃'
            else if(now < 6) return '🌅'
            else if(now < 12) return '🏞'
            };
            var sunrise = new Date(res.sys.sunrise*1000);
            var sunset = new Date(res.sys.sunset*1000);
            function sunmin () {
            if(sunrise.getMinutes() < 10) "0" + sunrise.getMinutes();
            return sunset.getMinutes();
            };
            function sunsmin () {
            if(sunset.getMinutes() < 10) "0" + sunset.getMinutes();
            return sunset.getMinutes();
            };
            function daterh () {
            if(date.getHours() < 10) "0" + date.getHours();
            return date.getHours()+3
            };
            function daterm () {
            if(date.getMinutes() < 10) "0" + date.getMinutes();
            return date.getMinutes();
            };
            var date = new Date(res.dt*1000);
            return context.reply(`${Timer()} ${res.name}, ${Utils.filter(res.sys.country)}

            ➖ Погода: ${res["weather"][0]["description"]} ,${res["weather"][0]["main"]}
            ➖ база: ${Utils.filter(res.base)}
            ➖ Сейчас там ${TempTo()}: ${res.main.temp}°С
            ➖ Рассвет: ${sunrise.getHours()+res.timezone/3600}:${sunmin()} (Местного времени)
            ➖ Закат: ${sunset.getHours()+res.timezone/3600}:${sunsmin()} (Местного времени)
            ➖ Скорость ветра: ${res.wind.speed} м/с
            ➖ направления ветра ${res.wind.deg}
            ➖ максимальная температура ${res.main.temp_max}°С
            ➖ влажность ${res.main.humidity}%
            ➖ облачность ${res.clouds.all}%
            ➖ Давление:  ${Math.floor(res.main.pressure / 1.33333)} ммРт.Ст
            ➖ Наименования ${res.name}
            ➖ минимальная температура ${res.main.temp_min}°С
            ➖ сдвиг времени в часах от utc равен ${res.timezone/3600}`)}).catch((error) => { context.reply(`город не найден`);})       
        }
    })*/
}