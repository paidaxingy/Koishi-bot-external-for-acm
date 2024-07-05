import { Context, Schema } from 'koishi';
import axios from 'axios';
import moment from 'moment';
import path from 'path';
import fs from 'fs';

export const name = 'today';
export interface Config {}
export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
  ctx.command('today <cfid:string>', '查询 Codeforces 用户当天解决的题目数量')
    .action(async ({ session }, cfid) => {
      const userInfoPath = path.join(__dirname, '../', '../', 'test', 'src', 'info.json'); // 修改为实际的info.json文件路径
      const info = JSON.parse(fs.readFileSync(userInfoPath, 'utf8'));
      const user1=session.userId;
      const challengerCfid = info[user1]; // 假设 user 格式已经是正确的 cfid
      if (!cfid&&!challengerCfid) {
        console.log(challengerCfid);
        return '请提供Codeforces的用户ID或绑定CFID';
      }
      if(!cfid){
        cfid=challengerCfid;
      }

      const response = await axios.get(`https://codeforces.com/api/user.status?handle=${cfid}&from=1&count=100`);
      const submissions = response.data.result;
      const todayStart = moment().startOf('day');

      let acCount = 0;
      const nameSet=new Set();
      submissions.forEach(submission => {
        const submissionTime = moment.unix(submission.creationTimeSeconds);
        if (submissionTime.isAfter(todayStart) && submission.verdict === 'OK'&&!nameSet.has(submission.problem.name)){
          acCount++;
          nameSet.add(submission.problem.name);
        }
      });

      return `${cfid} 在今天之内解决了 ${acCount} 道题目。`;
    });
}
