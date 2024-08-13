import { Context, Schema } from 'koishi'
import axios from 'axios';
import moment from 'moment';
import path from 'path';
import fs from 'fs';

export const name = 'inquire'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

function isInteger(str) {
  return /^\d+$/.test(str);
}

export function apply(ctx: Context) {
  // write your plugin here
  ctx.command('inquire <time:string> <cfid:string>', '查询 Codeforces 用户当天解决的题目数量')
  .action(async ({ session }, time, cfid) => {
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

    var html = '100';

    var todayStart = moment().startOf('day');
    if(isInteger(time)){
      if(parseInt(time) > 30){
        return '请输入一个 <= 30的值';
      }
      else if(parseInt(time) > 7)
        html = '300';
      todayStart = moment().subtract(parseInt(time), 'days');
    }
    else if(time === 'today')
      todayStart = moment().startOf('day');
    else if(time === 'week')
      todayStart = moment().subtract(7, 'days');
    else if(time === 'month'){
      todayStart = moment().subtract(30, 'days');
      html = '300';
    }
    else return '时间格式错误';
    
    var response = await axios.get(`https://codeforces.com/api/user.status?handle=${cfid}&from=1&count=`+html);


    const submissions = response.data.result;

    let acCount = 0;
    const nameMap = new Map();
    const rateMap = new Map();
    submissions.forEach(submission => {
      const submissionTime = moment.unix(submission.creationTimeSeconds);
      if (submissionTime.isAfter(todayStart) && submission.verdict === 'OK'&&!nameMap.has(submission.problem.name)){
        acCount++;
        if(submission.problem.rating === undefined) {
          nameMap.set(submission.problem.name, '未知');
          rateMap.set('未知', (rateMap.get('未知') || 0) + 1);
        }
        else {
          nameMap.set(submission.problem.name, submission.problem.rating);
          rateMap.set(submission.problem.rating, (rateMap.get(submission.problem.rating) || 0) + 1);
        }
      }
    });
    
    var nameStr = "";
    Array.from(nameMap.entries())
    .sort((a, b) => a[1] - b[1]) // 按 value 升序排序
    .forEach(([key, value]) => {
      nameStr += `《${key}》 : ${value}\n`;
      console.log(`${key}:${value}`);
    });
    
    var rateStr = "";
    Array.from(rateMap.entries())
    .sort((a, b) => a[0] < b[0] ? -1 : 1) // 按 key 升序排序
    .forEach(([key, value]) => {
      rateStr += ` ${key} 分 ${value} 道\n`;
      console.log(`${key}:${value}`);
    });


    var tmp = '今天之内';
    
    if(isInteger(time)){
      tmp = time + '天之内'
    }
    else if(time === 'today')
      tmp = '今天之内'
    else if(time === 'week')
      tmp = '一周内'
    else if(time === 'month')
      tmp = '一个月内'
    return `${cfid} 在`+ tmp +`解决了 ${acCount} 道题目。分别为\n${nameStr}共解决了\n${rateStr}`;
  });
}
