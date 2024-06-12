import { Context, Schema } from 'koishi';
import axios from 'axios';
import moment from 'moment';

export const name = 'week';
export interface Config {}
export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
  ctx.command('week <cfid:string>', '查询Codeforces用户过去一周解决的题目数量')
    .action(async ({ session }, cfid) => {
      if (!cfid) {
        return '请提供Codeforces的用户ID。';
      }

      const response = await axios.get(`https://codeforces.com/api/user.status?handle=${cfid}&from=1&count=100`);
      const submissions = response.data.result;
      const oneWeekAgo = moment().subtract(7, 'days');

      let acCount = 0;
      submissions.forEach(submission => {
        const submissionTime = moment.unix(submission.creationTimeSeconds);
        if (submissionTime.isAfter(oneWeekAgo) && submission.verdict === 'OK') {
          acCount++;
        }
      });

      return `${cfid} 在过去一周解决了 ${acCount} 道题目。`;
    });
}
