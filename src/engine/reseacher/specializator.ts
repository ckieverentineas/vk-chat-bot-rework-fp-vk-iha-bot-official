
async function User_Info(context: any) {
    let [userData] = await context.api.users.get({user_id: context.senderId});
    return userData
}

interface User {
    firstName: string;
    lastName: string;
    status?: string;
    id: number;
}

export async function Replacer_System_Params(text: string, context: any): Promise<string> {
    const info: any = await User_Info(context)
    let statuses = [
        ' сидит в ВК и листает ленту ',
        ' ищет интересные группы  ',
        ' читает свежие новости  ',
        ' слушает любимую музыку ' , 
        ' смотрит интересное видео ',
        ' общается с друзьями ',
        ' играет в интересную игру ',
        ' ест вкусную пиццу  ',
        ' пьет чай с печеньками ',
        ' мемит и троллит друзей ',
        ' просто скучает  ',   
        ' ждет выходных ',
        ' мечтает о лете и отпуске ',
        ' хочет спать ',
        ' думает о смысле жизни ',
        ' слушает "Радио Тапок" '
    ];
    const user: User = {
      firstName: info.first_name ?? '[имя неизвестено]',
      lastName: info.last_name ?? '[фамилия неизвестена]',
      status: info.status ?? statuses[Math.floor(Math.random() * statuses.length)],
      id: info.id ?? 1,
    };
    const replacedText = text
      .replace(/%userphoto%/g, `https://vk.com/id${user.id}`)
      .replace(/%username%/g, user.firstName)
      .replace(/%usersurname%/g, user.lastName)
      .replace(/%userstatus%/g, user.status || '');
    return replacedText;
  }