import { readFileSync, writeFile, writeFileSync } from 'fs';
import { Context, Schema } from 'koishi'
import path from 'path';

export const name = 'todayproblem'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

function parseData(data: string): Map<string, string> {
  // 定义正则表达式，匹配日期和 URL，其中 URL 可以是 http 或 https 开头
  const regex = /^(\d{4}-\d{2}-\d{2})\s+(https?:\/\/[^\s]+)$/gm;
  const map = new Map<string, string>();

  let match;
  while ((match = regex.exec(data)) !== null) {
    const date = match[1];
    const url = match[2];
    map.set(date, url);
  }

  return map;
}
function getCurrentUrl(map: Map<string, string>): string | null {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const currentDate = `${year}-${month}-${day}`;

  return map.get(currentDate) || null;
}

function validateFormat(stringArray: string[]): boolean {
  // 定义正则表达式，匹配 20xx-xx-xx 和以 http:// 开头的网址
  const regex = /^\d{4}-\d{2}-\d{2}[,，]https?:\/\/[^\s]+$/;

  // 检查每个字符串是否符合格式
  for (const str of stringArray) {
    console.log(str)
    if (!regex.test(str)) {
      console.log("题目格式不匹配:", str);
      return false;
    }
  }
  return true;
}

export function apply(ctx: Context) {
  // write your plugin here
  const filePath = path.join(__dirname, 'todayproblem.txt');
  const qqSet: Set<string> = new Set([ // 管理员QQ
      "xxx",
      "xxx",
      "xxx"
  ]);
  const isRoot = (qq: string): boolean => qqSet.has(qq);
  ctx.command('todayproblem [...str]', '更新今日一题')
  .alias('todayproblem [...str]')
  .action(async ({ session }, ...temp: string[]) => {
      if(!isRoot(session.userId)) {
        session.send('非管理员，暂无权限!');
        return;
      }
      
      if(!validateFormat(temp)) {
        session.send('格式错误，请重试!');
        return;
      }
      try {
        var data = temp.map(str => str.replace(/[，,]/g, " ")).join('\n');
        writeFileSync(filePath, data, 'utf-8'); // 替换 '文件路径.txt' 为你的文件路径
        console.log(`${filePath}文件写入成功`);
        data = readFileSync(filePath, 'utf-8');
        session.send(`已更新!内容为\n${data}`);
      } catch (err) {
        console.error(`写入 ${filePath} 文件时出错:`, err);
        session.send(`报错了，请联系管理员`);
      }
    });
  ctx.command('checktodayproblem', '查看今日一题')
  .action(async ({ session }) => {
      if(!isRoot(session.userId)) {
        session.send('非管理员，暂无权限!');
        return;
      }
      try {
        const data = readFileSync(filePath, 'utf-8');
        session.send(`今日一题内容为\n${data}`);
      } catch (err) {
        console.error(`读取${filePath} 文件时出错:`, err);
        session.send(`报错了，请联系管理员`);
      }
    });
  ctx.command('broadcasttodayproblem <qqNumber>', '广播今日一题')
  .action(async ({ session }, qqNumber: string) => {
      if(!isRoot(session.userId)) {
        session.send('非管理员，暂无权限!');
        return;
      }
      try {
        const data = readFileSync(filePath, 'utf-8');
        const map = parseData(data);
        if (map) {
          const currentUrl = getCurrentUrl(map);
          if (currentUrl) {
            try{
              await ctx.broadcast([`onebot:${qqNumber}`], `今日份每日一题\n${currentUrl}`); // 纳新群!!!!!!!!!!!!
            } catch (err) {
              session.send(`报错了${err}，请联系管理员`);
            }
          } else {
            session.send(`今天没有每日一题`);
          }
        } else {
          session.send(`数据不符合格式`);
        }
      } catch (err) {
        console.error(`读取${filePath} 文件时出错:`, err);
        session.send(`报错了，请联系管理员`);
      }
    });
}
