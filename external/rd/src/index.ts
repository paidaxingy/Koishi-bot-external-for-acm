import { Context, Schema } from 'koishi';
import fs from 'fs';
import path from 'path';

export const name = 'rd';

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
  ctx.command('rd <rating>', '根据难度随机推荐一道题目')
    .action(async ({ session }, rating) => {
      if (!rating) return '请提供题目的难度等级。';

      const filePath = path.join(__dirname, `${rating}.txt`); // 根据难度等级构建文件路径
      try {
        const data = fs.readFileSync(filePath, 'utf-8');
        const lines = data.split('\n').filter(Boolean); // 分割文件内容为行，并过滤空行
        if (lines.length === 0) return '该难度等级下没有题目。';

        const randomLine = lines[Math.floor(Math.random() * lines.length)]; // 随机选择一行
        return randomLine; // 发送随机选择的题目链接
      } catch (error) {
        console.error(error);
        return '读取题目时发生错误，请检查难度等级是否正确。';
      }
    });
}
