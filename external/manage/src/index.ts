import { Context, Schema } from 'koishi';
import fs from 'fs';
import path from 'path';

export const name = 'manage';

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

const cfidsPath = path.join(__dirname, '../', '../', 'monitor', 'src', 'cfids.json');
const supervisorsPath = path.join(__dirname, '../', '../', '../', 'supervisor.json');

// 读取管理员列表
function getSupervisors() {
  const data = fs.readFileSync(supervisorsPath, 'utf8');
  return JSON.parse(data).supervisors;
}

// 检查是否为管理员
function isSupervisor(userId) {
  const supervisors = getSupervisors();
  return supervisors.includes(userId.toString());
}

export function apply(ctx: Context) {
  ctx.command('qr', '查询所有cfid')
    .action(({ session }) => {
      const cfids = JSON.parse(fs.readFileSync(cfidsPath, 'utf8'));
      return cfids.join('\n');
    });

  ctx.command('ad [...cfids]', '批量添加CFID')
    .action(async ({ session }, ...cfids: string[]) => {
      if (!isSupervisor(session.userId)) return '您没有权限执行此操作。';

      const existingCfids = JSON.parse(fs.readFileSync(cfidsPath, 'utf8'));
      const addedCfids = [];
      cfids.forEach(cfid => {
        if (!existingCfids.includes(cfid)) {
          existingCfids.push(cfid);
          addedCfids.push(cfid);
        }
      });
      fs.writeFileSync(cfidsPath, JSON.stringify(existingCfids, null, 2));
      return addedCfids.length ? `成功添加CFID: ${addedCfids.join(', ')}` : '没有新的CFID被添加。';
    });

  ctx.command('del [...cfids]', '批量删除指定CFID')
    .action(async ({ session }, ...cfids: string[]) => {
      if (!isSupervisor(session.userId)) return '您没有权限执行此操作。';

      let existingCfids = JSON.parse(fs.readFileSync(cfidsPath, 'utf8'));
      const deletedCfids = [];
      cfids.forEach(cfid => {
        if (existingCfids.includes(cfid)) {
          existingCfids = existingCfids.filter(id => id !== cfid);
          deletedCfids.push(cfid);
        }
      });
      fs.writeFileSync(cfidsPath, JSON.stringify(existingCfids, null, 2));
      return deletedCfids.length ? `成功删除CFID: ${deletedCfids.join(', ')}` : '未找到指定的CFID。';
    });
}
