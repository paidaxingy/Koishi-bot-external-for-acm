import { readFileSync, writeFile, writeFileSync } from 'fs';
import { Context, Schema } from 'koishi'
import path from 'path';

export const name = 'todayproblem'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

function validateFormat(str: string): boolean {
  // 定义正则表达式，匹配 20xx-xx-xx 和以 http:// 开头的网址
  const regex = /^(20\d{2}-\d{2}-\d{2}) (http:\/\/[^\s]+)$/gm;

  // 使用正则表达式验证整个字符串
  // 每一行必须符合正则表达式，并且不能有不匹配的行
  return str.split('\n').every(line => regex.test(line));
}

export function apply(ctx: Context) {
  // write your plugin here
  const filePath = path.join(__dirname, 'todayproblem.txt');
  ctx.command('todayproblem <str:text>', '更新今日一题')
  .alias('todayproblem\n <str:text>')
  .action(async ({ session }, str) => {
      if(session.userId !== 'xxxxxx' && session.userId !== 'xxxxxx') {
        session.send('非管理员，暂无权限!');
        return;
      }
      if(!validateFormat(str)) {
        session.send('格式错误，请重试!');
        return;
      }
      try {
        writeFileSync(filePath, str, 'utf-8'); // 替换 '文件路径.txt' 为你的文件路径
        console.log(`${filePath}文件写入成功`);
        const data = readFileSync(filePath, 'utf-8');
        session.send(`已更新!内容为\n${data}`);
      } catch (err) {
        console.error(`写入 ${filePath} 文件时出错:`, err);
        session.send(`报错了，请联系管理员`);
      }
    });
    ctx.command('checktodayproblem', '查看今日一题')
    .action(async ({ session }) => {
        if(session.userId !== 'xxxxxx' && session.userId !== 'xxxxxx') {
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
}
