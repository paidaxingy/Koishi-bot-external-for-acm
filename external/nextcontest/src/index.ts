import { Context, Schema } from 'koishi';
import axios from 'axios';
import cheerio from 'cheerio';
import moment from 'moment-timezone';

export const name = 'nextcontest'

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

// 从Codeforces获取比赛信息
// 示例：从Codeforces获取比赛信息
async function fetchContestsCF() {
  try {
    const response = await fetch("https://codeforces.com/api/contest.list");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    let contests = []; // 使用数组存储比赛信息
    
    data.result.forEach((contest) => {
      if (contests.length >= 5) return; // 限制为前5个比赛
      if (contest.phase === 'BEFORE') {
        const contestTime = moment.unix(contest.startTimeSeconds).format('YYYY-MM-DD HH:mm:ss');
        const registrationLink = `https://codeforces.com/contestRegistration/${contest.id}`;
        contests.push({
          contestName: contest.name,
          contestTime: contestTime,
          contestLink: registrationLink
        });
      }
    });
    
    return contests; // 返回包含比赛信息对象的数组
  } catch (error) {
    console.error('cf, Error fetching contest data from Codeforces');
    return []; // 出错时返回空数组
  }
}

// 请根据实际情况调整Nowcoder和AtCoder的函数，确保它们也按照类似的方式抓取和返回数据。


// 从Nowcoder获取比赛信息
const fetchContestsNC = async () => {
  try {
    const { data } = await axios.get('https://ac.nowcoder.com/acm/contest/vip-index');
    const $ = cheerio.load(data);
    let contests = [];

    $('.platform-item.js-item').each((i, elem) => {
      if (contests.length >= 3) return; // 只处理前三个比赛
      const contestName = $(elem).find('.platform-item-cont h4 a').text().trim();
      // 直接获取比赛开始时间文本
      const matchTimeText = $(elem).find('.platform-info .match-time-icon').text();
      const contestStartTimeMatch = matchTimeText.match(/比赛时间：\s*(\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2})/);
      if (!contestStartTimeMatch) return; // 如果没有匹配到时间，则跳过
      const contestStartTime = contestStartTimeMatch[1];
      const contestLink = 'https://ac.nowcoder.com' + $(elem).find('.platform-item-cont h4 a').attr('href');

      contests.push({
        contestName,
        contestTime: contestStartTime,
        contestLink,
      });
    });

    return contests; // 返回包含比赛信息对象的数组
  } catch (error) {
    console.error('nc, Error fetching contest data from Nowcoder:');
    return []; // 出错时返回空数组
  }
};


// 从AtCoder获取比赛信息
async function fetchContestsAC() {
  try {
    const { data } = await axios.get('https://atcoder.jp/contests/');
    const $ = cheerio.load(data);
    let contests = [];
    let count = 0;

    $('#contest-table-upcoming tbody tr').each((i, elem) => {
      if (count >= 3) return; // 只处理前三个比赛

      const timeText = $(elem).find('td:nth-child(1) time').text().trim();
      const contestTime = moment(timeText, 'YYYY-MM-DD HH:mm:ssZ').format('YYYY-MM-DD HH:mm:ss');
      const contestName = $(elem).find('td:nth-child(2) a').text().trim();
      const contestLink = 'https://atcoder.jp' + $(elem).find('td:nth-child(2) a').attr('href');

      contests.push({
        contestName,
        contestTime,
        contestLink,
      });

      count++;
    });

    return contests; // 返回包含比赛信息对象的数组
  } catch (error) {
    console.error('atc, Error fetching contest data:');
    return []; // 出错时返回空数组
  }
}

// 获取最近一场比赛的信息
async function fetchNearestContest() {
  const cfContests = await fetchContestsCF();
  const ncContests = await fetchContestsNC();
  const acContests = await fetchContestsAC();
  const allContests = [...cfContests, ...ncContests, ...acContests];
  console.log(allContests);
  let str = '';
  if(cfContests.length === 0) str += 'Codeforces';
  if(ncContests.length === 0) str += str.length ? ' NowCoder': 'NowCoder';
  if(acContests.length === 0) str += str.length ? ' AtCoder': 'AtCoder';

  const sortedContests = allContests.sort((a, b) => moment(a.contestTime, 'YYYY-MM-DD HH:mm:ss').diff(moment(b.contestTime, 'YYYY-MM-DD HH:mm:ss')));
  return sortedContests.length ? {nearestContest:sortedContests[0], emptyPlatforms: str} : null;
}


function calculateTimeDifference(date1, date2) {
  // 计算两个日期之间的毫秒数差值
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());

  const secondsDiff = Math.floor(timeDiff / 1000);

  return secondsDiff;
}

function GetDiffTime(dateStr, now) {
  // 创建一个表示特定日期的 Date 对象
  const isoDateStr = dateStr.replace(' ', 'T');
  const specificDate = new Date(isoDateStr);
  
  return calculateTimeDifference(specificDate,now);
}

function calculateTimeDifference_all(date1, date2) {
  // 计算两个日期之间的毫秒数差值
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());

  // 将毫秒数差值转换为天数、小时数和秒数
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hoursDiff = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutesDiff = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const secondsDiff = Math.floor((timeDiff % (1000 * 60)) / 1000);

  return ' ' + daysDiff +' 天 '+ hoursDiff +' 小时 '+ minutesDiff +' 分钟 '+ secondsDiff +' 秒';
}

function GetDiffTime_all(dateStr, now) {
  // 创建一个表示特定日期的 Date 对象
  const isoDateStr = dateStr.replace(' ', 'T');
  const specificDate = new Date(isoDateStr);

  return calculateTimeDifference_all(specificDate,now);
}


function formatTime(currentHour, currentMinute) {
  var hourStr = currentHour.toString().padStart(2, '0') + ':';
  var minuteStr = currentMinute.toString().padStart(2, '0');
  return hourStr + minuteStr;
}

export function apply(ctx: Context) {
  // write your plugin here
  // 每隔60秒执行特定操作
  var diffSec;
  var oneHourTime, tenMinTime;
  var f0 = false, f1 = false;
setInterval(async () => {
  // 获取当前时间
  var now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentSecond = now.getSeconds();
  if(currentSecond !==5 )return ;
  if(currentHour === 9 && currentMinute === 0) {
    const result = await fetchNearestContest();
    if (result && result.nearestContest) {
      const nearestContest = result.nearestContest;
      var message = `比赛名称: ${nearestContest.contestName}\n比赛时间: ${nearestContest.contestTime}\n报名链接: ${nearestContest.contestLink}\n`;
      message += result.emptyPlatforms.length !== 0 ? `${result.emptyPlatforms}因网络原因，没有相关信息。`: ``;
      diffSec = GetDiffTime(nearestContest.contestTime, now);

      await ctx.broadcast(['onebot:xxxxx'], `现在是 ${formatTime(currentHour, currentMinute)}\n最近的比赛:\n` + message);
      if(diffSec >= 3610) {
        oneHourTime = new Date(now.getTime() + (diffSec - 3600) * 1000);
        f0 = true;
      } else if(diffSec >= 610){
        tenMinTime = new Date(now.getTime() + (diffSec - 600) * 1000);
        f1 = true;
      }
    }
  }
  if(currentHour >= 9 && currentMinute === 15 && currentHour % 1 === 0) {
    const result = await fetchNearestContest();
    if (result && result.nearestContest) {
      const nearestContest = result.nearestContest;
      diffSec = GetDiffTime(nearestContest.contestTime, now);
      if(diffSec >= 3610) {
        oneHourTime = new Date(now.getTime() + (diffSec - 3600) * 1000);
        f0 = true;
      } else if(diffSec >= 610){
        tenMinTime = new Date(now.getTime() + (diffSec - 600) * 1000);
        f1 = true;
      }
      console.log(oneHourTime);
    }
  }
  if(now >= tenMinTime && f1) {
    f1 = false;
    const result = await fetchNearestContest();
    if (result && result.nearestContest) {
      const nearestContest = result.nearestContest;
      var message = `比赛名称: ${nearestContest.contestName}\n比赛时间: ${nearestContest.contestTime}\n报名链接: ${nearestContest.contestLink}\n`;
      // message += `\n距离比赛开始还有${GetDiffTime_all(nearestContest.contestTime, new Date())}开始。`
      message += '友情提示：距离比赛开始时间不足一小时！\n';
      message += result.emptyPlatforms.length !== 0 ? `${result.emptyPlatforms}因网络原因，没有相关信息。`: ``;
      
      await ctx.broadcast(['onebot:xxxxx'], `现在是 ${formatTime(currentHour, currentMinute)}\n最近的比赛:\n` + message);
    }
  }

  if(now >= oneHourTime && f0) {
    f0 = false;
    const result = await fetchNearestContest();
    if (result && result.nearestContest) {
      const nearestContest = result.nearestContest;
      var message = `比赛名称: ${nearestContest.contestName}\n比赛时间: ${nearestContest.contestTime}\n报名链接: ${nearestContest.contestLink}\n`;
      // message += `\n距离比赛开始还有${GetDiffTime_all(nearestContest.contestTime, new Date())}开始。`
      message += '友情提示：距离比赛开始时间不足十分钟！\n';
      message += result.emptyPlatforms.length !== 0 ? `${result.emptyPlatforms}因网络原因，没有相关信息。`: ``;
      
      await ctx.broadcast(['onebot:xxxxx'], `现在是 ${formatTime(currentHour, currentMinute)}\n最近的比赛:\n` + message);
    }
    tenMinTime = new Date(now.getTime() + 2700 * 1000);
    f1 = true;
  }
  
}, 1000);

}

// // 集成到Koishi插件中
// export function apply(ctx: Context) {
//   ctx.command('next', '获取离现在最近的比赛信息')
//     .action(async ({ session }) => {
//       const nearestContest = await fetchNearestContest();
//       if (nearestContest) {
//         const message = `比赛名称: ${nearestContest.contestName}\n比赛时间: ${nearestContest.contestTime}\n报名链接: ${nearestContest.contestLink}`;
//         await session.send(message);
//       } else {
//         await session.send('没有找到即将开始的比赛信息。');
//       }
//     });
// }
