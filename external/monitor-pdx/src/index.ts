import { Context, Schema } from 'koishi';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import moment from 'moment';

export const name = 'monitor';
export interface Config {}
export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
    const cfidsPath = path.join(__dirname, 'cfids.json');
    let lastPassedSubmissionId = {};

    async function initializeLastPassedSubmissionId(cfids) {
        for (const cfid in cfids) {  // 使用 for...in 迭代对象的键
            const response = await axios.get(`https://codeforces.com/api/user.status?handle=${cfid}&from=1&count=10`);
            const submissions = response.data.result.filter(sub => sub.verdict === 'OK');
            if (submissions.length > 0) {
                lastPassedSubmissionId[cfid] = submissions[0].id;
            }
    
            const now = new Date(); // 获取当前时间
            const hours = now.getHours(); // 获取小时，例如 10
            const minutes = now.getMinutes(); // 获取分钟，例如 30
            const seconds = now.getSeconds(); // 获取秒，例如 45
    
            const s=`${hours}:${minutes}:${seconds} ${cfid}:${lastPassedSubmissionId[cfid]}`
    
            console.log(s)
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    async function checkNewPassedProblem(cfid,name) {
        const response = await axios.get(`https://codeforces.com/api/user.status?handle=${cfid}&from=1&count=10`);
        const newPassedSubmissions = response.data.result.filter(sub => sub.verdict === 'OK' && sub.id > lastPassedSubmissionId[cfid]);
        if (newPassedSubmissions.length > 0) {
            lastPassedSubmissionId[cfid] = newPassedSubmissions[0].id;
            const problemName = newPassedSubmissions[0].problem.name;
            const rating = newPassedSubmissions[0].problem.rating || '未知';
                                    
            const time=newPassedSubmissions[0].creationTimeSeconds;

            let hh=((Math.floor((time%86400)/3600)+8)%24).toString().padStart(2, '0');
            let mm = Math.floor(((time % 86400) % 3600) / 60).toString().padStart(2, '0');
            let ss=(((time%86400)%3600)%60).toString().padStart(2, '0');

            const response = await axios.get(`https://codeforces.com/api/user.status?handle=${cfid}&from=1&count=100`);
            const submissions = response.data.result;
            
            console.log(time);
            console.log(moment(new Date(time*1000)));

            var todayStart = moment(new Date(time*1000)).startOf('day');
            var todayEnd=moment(new Date(time*1000)).endOf('day');
            console.log(todayStart);
            console.log(todayEnd);

            let acCount = 0;
            const nameSet=new Set();
            submissions.forEach(submission => {
              const submissionTime = moment.unix(submission.creationTimeSeconds);
              if (submissionTime.isBetween(todayStart, todayEnd, null, '[]') && submission.verdict === 'OK'&&!nameSet.has(submission.problem.name)){
                acCount++;
                nameSet.add(submission.problem.name);
              }
            });
             //----------------------------------------------------




             const message = `恭喜 ${name}(${cfid}) 在 ${hh}:${mm}:${ss} 通过了题目：${problemName}，难度：${rating}`+
             `，今天之内他一共解决了 ${acCount} 道题目了哦。`;
             ;
             // 在这里发送消息
            await ctx.broadcast(['onebot:xxxxxxxxx'],message);// 替换成你的目标群组ID
        }
        //await ctx.broadcast('test')

        const now = new Date(); // 获取当前时间
        const hours = now.getHours(); // 获取小时，例如 10
        const minutes = now.getMinutes(); // 获取分钟，例如 30
        const seconds = now.getSeconds(); // 获取秒，例如 45

        const s=`${hours}:${minutes}:${seconds} ${cfid}:${lastPassedSubmissionId[cfid]}`
        console.log(s)
    }

    async function main() {
    const cfidsPath = path.join(__dirname, 'cfids.json');
    const cfids = JSON.parse(fs.readFileSync(cfidsPath, 'utf8'));
    await initializeLastPassedSubmissionId(cfids);

    // 设置定时器，每60秒执行一次检查
    setInterval(async () => {
    const cfidsPath = path.join(__dirname, 'cfids.json');
    const cfids = JSON.parse(fs.readFileSync(cfidsPath, 'utf8'));
        for (const cfid in cfids) {
            const name = cfids[cfid];
            await checkNewPassedProblem(cfid,name);
            // 在处理每个cfid后等待5秒
            await new Promise(resolve => setTimeout(resolve, 5000+Math.floor(Math.random() * 5000)));
        }
    }, 270000+Math.floor(Math.random() * 60000)); // 600000毫秒 = 60秒
}


    main();
}
