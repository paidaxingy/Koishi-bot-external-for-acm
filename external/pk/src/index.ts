import { Context, Schema } from 'koishi';
import fs from 'fs';
import path from 'path';
import axios from 'axios'; // 确保已经安装 axios

export const name = 'pk';

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
    const challenges = new Map();
    const userChallengeMap = new Map(); // 新增映射：用户ID -> 挑战ID


    ctx.command('pk <user:string> <problemLink:string>', '向其他用户发起挑战')
        .action(async ({ session }, user, problemLink) => {
          const userInfoPath = path.join(__dirname, '../', '../', 'test', 'src', 'cfids.json'); // 修改为实际的info.json文件路径
          const info = JSON.parse(fs.readFileSync(userInfoPath, 'utf8'));
          if (!problemLink) {
                session.send('请输入题目链接。');
                return;
            }
            const match = problemLink.match(/contest\/(\d+)\/problem\/(\w+)/);
            if (!match) {
                session.send('题目链接格式不正确。');
                return;
            }
            const user1=session.userId;
            const user2=user.replace(/[^0-9]/g, '');
            console.log(user2)
            const challengerCfid = info[user1];
            const challengeeCfid = info[user2]; // 假设 user 格式已经是正确的 cfid
            if (!challengerCfid || !challengeeCfid) {
                session.send('挑战双方必须先绑定CFID。');
                return;
            }

            const challengeId = `${challengerCfid}-${challengeeCfid}`;

            if (challenges.has(challengeId)) {
                session.send('已有挑战正在进行中，请稍后再试。');
                return;
            }
            userChallengeMap.set(challengerCfid, challengeId);
            userChallengeMap.set(challengeeCfid, challengeId);
            challenges.set(challengeId, {
                challenger: challengerCfid,
                challengee: challengeeCfid,
                problemLink,
                accept: false,
                timeoutId: null // 这里添加用于取消挑战的定时器ID
            });

            session.send(`${challengeeCfid}, 你接受挑战吗？回复 'accept' 或 'reject'。`);
            // 设置定时器，在一分钟后检查挑战是否被接受
            const timeoutId = setTimeout(() => {
              if (challenges.has(challengeId) && !challenges.get(challengeId).accept) {
                session.send(`挑战已取消，${challengeeCfid} 未在规定时间内响应。`);
                challenges.delete(challengeId);
                userChallengeMap.delete(challenge.challenger);
                userChallengeMap.delete(challenge.challengee);
              }
            }, 60000); // 60秒后执行

        // 存储定时器ID以便后续清除
            const challenge = challenges.get(challengeId);
            if (challenge) {
                challenge.timeoutId = timeoutId;
                challenges.set(challengeId, challenge);
            }
        });

    ctx.middleware(async (session, next) => {
        const content = session.content;
        const command = content;
        const userInfoPath = path.join('D:', 'pdxbot1', 'external', 'test', 'src', 'info.json'); // 修改为实际的info.json文件路径
        const info = JSON.parse(fs.readFileSync(userInfoPath, 'utf8'));
        const challengeId = userChallengeMap.get(info[session.userId]);
        const challenge = challenges.get(challengeId);
        //console.log(challengeId)
        if (!challenge) return next();

        if (command === 'accept' && challenge && info[session.userId] === challenge.challengee) {
            challenge.accept = true;
            challenges.set(challengeId, challenge); // 更新挑战状态
            session.send('挑战已接受，请在一小时内完成。');

            setTimeout(() => {
                if (challenge.accept) {
                    session.send(`挑战时间结束。${challenge.challenger} 和 ${challenge.challengee} 都没有完成挑战。`);
                    challenges.delete(challengeId);
                    userChallengeMap.delete(challenge.challenger);
                    userChallengeMap.delete(challenge.challengee);
                }
            }, 3600000); // 一小时后自动结束挑战3600000
        } else if ((command === 'reject' )&& challenge && info[session.userId] === challenge.challengee) {
            session.send('挑战被拒绝。');
            challenges.delete(challengeId);
            userChallengeMap.delete(challenge.challenger);
            userChallengeMap.delete(challenge.challengee);
        }

        return next();
    });

    ctx.command('pkfinish <challengeId:string>', '完成挑战')
        .action(async ({ session }) => {
          const userInfoPath = path.join('D:', 'pdxbot1', 'external', 'test', 'src', 'info.json'); // 修改为实际的info.json文件路径
          const info = JSON.parse(fs.readFileSync(userInfoPath, 'utf8'));
          const challengeId=userChallengeMap.get(info[session.userId]);
          if(!challengeId)
          {
            session.send('你未参与任何挑战。');
            return;
          }
          const challenge = challenges.get(challengeId);
            if (!challenge || !challenge.accept) {
                session.send('当前没有正在进行的挑战或挑战未被接受。');
                return;
            }

            const match = challenge.problemLink.match(/contest\/(\d+)\/problem\/(\w+)/);
            if (!match) {
                session.send('题目链接格式不正确。');
                return;
            }
            const contestId = match[1];
            const index = match[2];

            try {
                const challengerSubmissions = await axios.get(`https://codeforces.com/api/user.status?handle=${challenge.challenger}&from=1&count=1`);
                const challengeeSubmissions = await axios.get(`https://codeforces.com/api/user.status?handle=${challenge.challengee}&from=1&count=1`);

                const challengerSubmission = challengerSubmissions.data.result.find(submission =>
                    submission.problem.contestId == contestId &&
                    submission.problem.index === index &&
                    submission.verdict === "OK");

                const challengeeSubmission = challengeeSubmissions.data.result.find(submission =>
                    submission.problem.contestId == contestId &&
                    submission.problem.index === index &&
                    submission.verdict === "OK");

                // 判断胜负
                if (challengerSubmission && (!challengeeSubmission || challengerSubmission.creationTimeSeconds < challengeeSubmission.creationTimeSeconds)) {
                    session.send(`${challenge.challenger} 在挑战中战胜了 ${challenge.challengee}，首先完成了题目。`);
                } else if (challengeeSubmission) {
                    session.send(`${challenge.challengee} 在挑战中战胜了 ${challenge.challenger}，首先完成了题目。`);
                } else {
                    session.send('挑战失败，没有参与者成功完成题目。');
                }
            } catch (error) {
                console.error('获取提交记录失败:', error);
                session.send('检查挑战结果时发生错误，请稍后再试。');
            }

            challenges.delete(challengeId); // 无论结果如何，挑战结束后删除记录
            userChallengeMap.delete(challenge.challenger);
            userChallengeMap.delete(challenge.challengee);
        });
}
