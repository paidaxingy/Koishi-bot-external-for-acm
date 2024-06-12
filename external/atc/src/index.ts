import { Context, Schema } from 'koishi'
import axios from 'axios';
import cheerio from 'cheerio';
import moment from 'moment-timezone';

export const name = 'atc'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

async function fetchUpcomingContests() {
  try {
    const { data } = await axios.get('https://atcoder.jp/contests/');
    const $ = cheerio.load(data);
    let contestsInfo = "";
    let count = 0;

    $('#contest-table-upcoming tbody tr').each((i, elem) => {
      if (count >= 3) return; // 只处理前三个比赛

      const timeText = $(elem).find('td:nth-child(1) time').text().trim();
      const contestTime = moment(timeText, 'YYYY-MM-DD HH:mm:ssZ').format('YYYY-MM-DD HH:mm:ss');
      const contestName = $(elem).find('td:nth-child(2) a').text().trim();
      const contestLink = 'https://atcoder.jp' + $(elem).find('td:nth-child(2) a').attr('href');

      contestsInfo += `比赛名称:${contestName}\n比赛时间:${contestTime}\n比赛链接:${contestLink}\n\n`;
      count++;
    });

    return contestsInfo;
  } catch (error) {
    console.error('Error fetching contest data:', error);
    return '获取比赛信息时发生错误。';
  }
}

export function apply(ctx: Context) {
  ctx.command('atc','获得atcoder最近比赛')
    .action(async ({ session }) => {
      const contestsInfo = await fetchUpcomingContests();
      session.send(contestsInfo);
    });
}
