import { Context, Schema } from 'koishi';
import axios from 'axios';
import cheerio from 'cheerio';
import moment from 'moment';

export const name = 'nc';

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

// 定义fetchContests函数来获取比赛信息
const fetchContests = async () => {
  try {
    const { data } = await axios.get('https://ac.nowcoder.com/acm/contest/vip-index');
    const $ = cheerio.load(data);
    let contestsInfo = '';
    let count = 0;

    $('.platform-item.js-item').each((i, elem) => {
      if (count >= 3) return; // 只处理前三个比赛
      const contestName = $(elem).find('.platform-item-cont h4 a').text().trim();
      // 直接获取比赛开始时间文本
      const matchTimeText = $(elem).find('.platform-info .match-time-icon').text();
      const contestStartTime = matchTimeText.match(/比赛时间：\s*(\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2})/)[1];
      const contestLink = 'https://ac.nowcoder.com' + $(elem).find('.platform-item-cont h4 a').attr('href');

      contestsInfo += `比赛名称: ${contestName}\n比赛时间: ${contestStartTime}\n报名链接: ${contestLink}\n\n`;
      count++;
    });

    return contestsInfo;
  } catch (error) {
    console.error('Error fetching contest data:', error);
    return '获取比赛信息时发生错误。';
  }
};


// 将fetchContests函数集成到Koishi插件中
export function apply(ctx: Context) {
  ctx.command('nc','获得牛客最近比赛').action(async ({ session }) => {
    const contestsInfo = await fetchContests();
    await session.send(contestsInfo);
  });
}
