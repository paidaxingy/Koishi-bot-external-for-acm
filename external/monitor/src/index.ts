import { Context, Schema } from 'koishi';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export const name = 'monitor';
export interface Config {}
export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
    const cfidsPath = path.join(__dirname, 'cfids.json');
    let lastPassedSubmissionId = {};

    async function initializeLastPassedSubmissionId(cfids) {
        for (const cfid of cfids) {
            const response = await axios.get(`https://codeforces.com/api/user.status?handle=${cfid}&from=1&count=10`);
            const submissions = response.data.result.filter(sub => sub.verdict === 'OK');
            if (submissions.length > 0) {
                lastPassedSubmissionId[cfid] = submissions[0].id;
            }
            const s=`${cfid}:${lastPassedSubmissionId[cfid]}`
            console.log(s)
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    async function checkNewPassedProblem(cfid) {
        const response = await axios.get(`https://codeforces.com/api/user.status?handle=${cfid}&from=1&count=10`);
        const newPassedSubmissions = response.data.result.filter(sub => sub.verdict === 'OK' && sub.id > lastPassedSubmissionId[cfid]);
        if (newPassedSubmissions.length > 0) {
            lastPassedSubmissionId[cfid] = newPassedSubmissions[0].id;
            const problemName = newPassedSubmissions[0].problem.name;
            const rating = newPassedSubmissions[0].problem.rating || '未知';
            const message = `恭喜 ${cfid} 通过了题目：${problemName}，难度：${rating}`;
            // 在这里发送消息
            const targetGroupId = '705659347'; // 替换成你的目标群组ID
            //await ctx.broadcast(['onebot:3379197776'], '全体目光向我看齐')
            await ctx.broadcast(message)
        }
        //await ctx.broadcast('test')
        const s=`${cfid}:${lastPassedSubmissionId[cfid]}`
        console.log(s)
    }

    async function main() {
    const cfids = JSON.parse(fs.readFileSync(cfidsPath, 'utf8'));
    await initializeLastPassedSubmissionId(cfids);

    // 设置定时器，每60秒执行一次检查
    setInterval(async () => {
        for (const cfid of cfids) {
            await checkNewPassedProblem(cfid);
            // 在处理每个cfid后等待5秒
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }, 600000); // 60000毫秒 = 60秒
}


    main();
}
