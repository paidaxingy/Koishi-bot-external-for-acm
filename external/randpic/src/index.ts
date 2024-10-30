import { setEngine } from 'crypto';
import { Context, Schema, sleep } from 'koishi'
import { pathToFileURL } from 'url'
import { resolve } from 'path'
const fs = require('fs')
const path = require('path')
export const name = 'rc'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

function getRandomFile(dirPath: string): string {
  try {
      // 读取目录中的所有文件和文件夹
      const files = fs.readdirSync(dirPath);

      if (files.length === 0) {
          throw new Error("目录中没有文件");
      }

      // 随机选择一个文件
      const randomIndex = Math.floor(Math.random() * files.length);
      const selectedFile = files[randomIndex];

      // 返回完整路径
      return path.join(dirPath, selectedFile);
  } catch (error) {
      throw new Error(`无法读取目录: ${error.message}`);
  }
}
function getFirstFileByModifiedTime(dirPath: string): string {
  try {
    // 读取目录中的所有文件和文件夹
    const files = fs.readdirSync(dirPath);

    if (files.length === 0) {
      throw new Error("目录中没有文件");
    }

    // 获取文件的完整路径，并获取每个文件的修改时间
    const sortedFiles = files
      .map(file => {
        const fullPath = path.join(dirPath, file);
        const stats = fs.statSync(fullPath);
        return { file: fullPath, mtime: stats.mtime.getTime() };
      })
      // 按修改时间从新到旧排序
      .sort((a, b) => b.mtime - a.mtime);

    // 返回排序后的第一个文件（即最近修改的文件）
    return sortedFiles[0].file;
  } catch (error) {
    throw new Error(`无法读取目录: ${error.message}`);
  }
}

export function apply(ctx: Context) {
  // write your plugin here
  
    ctx.command('lzgg', 'lzgg')
    .action(async ({ session }) => {
      const url = getRandomFile("D:\\PATH")
      return '<img src="' + url + '"/>'
    });
    
    ctx.command('topgg', 'lzgg')
    .alias('top')
    .alias('last')
    .action(async ({ session }) => {
      const url = getFirstFileByModifiedTime("D:\\PATH")
      return '<img src="' + url + '"/>'
    });
}