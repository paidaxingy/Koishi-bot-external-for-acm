import { Context, Schema } from 'koishi';
import { randomBytes } from 'crypto';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export const name = 'aichat';

export interface Config {}

// 生成一个随机的哈希值
function generateRandomHash(): string {
  return randomBytes(16).toString('hex');
}

const randomHash = generateRandomHash();
console.log(randomHash);
export function apply(ctx: Context) {
  ctx.command('添加xx <file:img>', '添加入xx经典集合')
  .alias('添加xx\n <file:img>')
    .action(async ({ session }, url) => {
      console.log(session.content);
      const str = session.content;
      // 匹配网络 URL 的正则表达式
      const urlPattern = /https?:\/\//;
      
      // 匹配本地文件路径（如带有哈希值的文件名）的正则表达式
      const regex = /\b[A-F0-9]{32}\b/;
      if(str.match(urlPattern)) {
        const urlMatch = str.match(/url="(.*?)"/);
        const imageUrl = urlMatch ? urlMatch[1] : null;
        // console.log(imageUrl);
        if (!imageUrl) {
          return '请上传一张图片。';
        }
        // 定义图片保存的路径
        const filePath = path.join('D:', '来只xx', generateRandomHash() + '.jpg');

        try {
          // 获取图片内容
          const response = await axios({
            url: imageUrl ,
            method: 'GET',
            responseType: 'stream',
          });
  
          // 创建一个可写流将内容写入文件
          const writer = fs.createWriteStream(filePath);
  
          // 用管道（pipe）把获取的图片流传输到写入流
          response.data.pipe(writer);
  
          return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve('添加成功!'));
            writer.on('error', (err) => {
              console.error(err);
              reject('添加失败:!');
            });
          });
        } catch (error) {
          console.error(error);
          return '添加时出错';
        }
      } else if(str.match(regex)) {
        const match = str.match(/src="([^"]+)"/);

        if (!match || !match[1]) {
            return '请上传一张图片。';
        }
        // console.log(match[1]);
        const getCurrentYearMonth = (): string => {
            const today = new Date();
            const year = today.getFullYear();
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            return `${year}-${month}`;
        };
        const yearMonth = getCurrentYearMonth();
        const fileName = match[1];// 匹配例如：4F9775DC28D24B2ED23BE6E2C3EDB621.png
        
        const sourcePath = path.join('D:\\', 'xxxx', 'Documents', 'Tencent Files', 'xxxxxxxxxx', 'nt_qq', 'nt_data', 'Pic', yearMonth, 'Ori', fileName);
        const destinationPath = path.join('D:\\', '来只xx', fileName);
        
        return new Promise((resolve, reject) => {
            try {
                fs.renameSync(sourcePath, destinationPath);  // 使用同步方式移动文件
                resolve('添加成功!');
            } catch (err) {
                console.error(err);  // 输出错误信息到控制台
                reject('添加失败!');
            }
        });
      } else {
        return '添加失败了！！！'
      }
    });
}
