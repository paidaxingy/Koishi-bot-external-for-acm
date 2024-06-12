import { Context, Schema } from 'koishi';
import axios from 'axios';

export const name = 'rc';

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
  ctx.command('rc <cfid:string>', '查询Codeforces用户的rating变化')
    .action(async ({ session }, cfid) => {
      if (!cfid) {
        // 如果没有提供cfid，提示用户输入
        return '请输入Codeforces的用户ID。例如：rc tourist';
      }

      // 查询Codeforces API获取rating变化
      try {
        const response = await axios.get(`https://codeforces.com/api/user.rating?handle=${cfid}`);
        const data = response.data;

        if (data.status === "OK" && data.result.length > 0) {
          const latestChange = data.result[data.result.length - 1];
          return `${cfid} 在 ${latestChange.contestName} 比赛中排名 ${latestChange.rank}，分数变化 ${latestChange.oldRating} -> ${latestChange.newRating}`;
        } else if (data.status === "FAILED") {
          return `查询失败: ${data.comment}`;
        } else {
          return "没有找到比赛信息。";
        }
      } catch (error) {
        console.error('Error fetching user rating change:', error);
        return "请输入合法的cfid。";
      }
    });
}
