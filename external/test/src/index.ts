import { Context, Schema, segment } from 'koishi';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export const name = 'bindCFID';

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
  // 绑定cfid命令
  ctx.command('bind <cfid:string>', '绑定Codeforces ID')
    .action(async ({ session }, cfid) => {
      if (!cfid) {
        return '请输入Codeforces ID。';
      }

      session.send('请在https://codeforces.com/problemset/problem/2/B 这道题一分钟之内交一发CE,完成后输入finish。');

      // 等待用户发送"finish"命令
      const waitFinish = new Promise((resolve) => {
        const dispose = ctx.middleware((session, next) => {
          if (session.content === 'finish') {
            dispose();
            resolve(undefined);
          }
          return next();
        });
      });

      // 设置一分钟的超时
      const timeout = new Promise((resolve) => setTimeout(resolve, 60000));
      await Promise.race([waitFinish, timeout]);

      // 检查提交
      try {
        const { data } = await axios.get('https://codeforces.com/api/contest.status?contestId=2&from=1&count=1');
        if (data.status === 'OK' && data.result.length > 0) {
          const submission = data.result[0];
          if (submission.author.members.some(member => member.handle.toLowerCase() === cfid.toLowerCase()) && submission.problem.index === 'B') {
            // 绑定成功，更新info.json文件
            const infoPath = path.join(__dirname, 'info.json');
            const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
            info[session.userId] = cfid;
            fs.writeFileSync(infoPath, JSON.stringify(info, null, 2));
            return '绑定成功！';
          }
        }
        return '绑定失败，请确保在指定时间内提交并且提交了正确的问题。';
      } catch (error) {
        console.error('API请求失败:', error);
        return '发生错误，请稍后再试。';
      }
    });





}
