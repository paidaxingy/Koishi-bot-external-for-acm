import { Schema } from 'koishi';
const moment = require('moment');

export const name = 'cf'

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

async function fetchContests() {
  try {
    const response = await fetch("https://codeforces.com/api/contest.list");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    let contests = [];
    let count = 0;
   
    for (const contest of data.result) {
      if (count >= 3) break; // 只获取最近的三场比赛
      if (contest.phase === 'BEFORE') {
        const contestTime = moment.unix(contest.startTimeSeconds);
        if (contestTime.isAfter(moment())) { // 晚于当前时间才计入
          contests.push({
            name: contest.name,
            time: contestTime,
            link: `https://codeforces.com/contestRegistration/${contest.id}`
          });
          count++;
        }
      }
    }

    contests.sort((a, b) => a.time.valueOf() - b.time.valueOf());

    let contestsInfo = "";
    for (const contest of contests) {
      contestsInfo += `比赛名称: ${contest.name}\n`;
      contestsInfo += `比赛时间: ${contest.time.format('YYYY-MM-DD HH:mm:ss')}\n`;
      contestsInfo += `比赛链接: ${contest.link}\n\n`;
    }
   
    return contestsInfo;
  } catch (error) {
    console.error('cf, Error fetching contest data from Codeforces:', error);
    return "获取比赛信息时发生错误。";
  }
}

export function apply(ctx) {
  ctx.command('cf', '获取Codeforces即将开始的比赛信息')
    .action(async ({ session }) => {
      console.log('get_cf_info');
      const contestsInfo = await fetchContests(); // 等待fetchContests完成
      session.send(contestsInfo); // 发送fetchContests返回的字符串
    });
}

