const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');

async function fetchContests() {
  try {
    const response = await axios.get('https://codeforces.com/contests');
    const html = response.data;
    const $ = cheerio.load(html);
    let contestsInfo = "";
    let count = 0; // 添加计数器

    $('tr[data-contestid]').each((i, elem) => {
      if (count >= 3) return; // 如果已经获取了前三个比赛，停止循环
      let contestTimeText = $(elem).find('.format-time').text().trim();
      let contestTime = moment(contestTimeText, 'MMM/DD/YYYY HH:mm');
      contestTime.add(5, 'hours'); // 根据需要调整时间

      const currentTime = moment();
      if (contestTime.isAfter(currentTime)) {
        const contestName = $(elem).find('td').first().text().trim();
        const contestDuration = $(elem).find('td').eq(3).text().trim();
        const contestId = $(elem).attr('data-contestid').trim();
        const registrationLink = `https://codeforces.com/contestRegistration/${contestId}`;

        contestsInfo += `比赛名称: ${contestName}\n比赛时间: ${contestTime.format('YYYY-MM-DD HH:mm:ss')}\n比赛链接: ${registrationLink}\n\n`;
        count++; // 处理完一个比赛后，计数器加1
      }
    });

    return contestsInfo;
  } catch (error) {
    console.error('Error fetching contest data:', error);
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

