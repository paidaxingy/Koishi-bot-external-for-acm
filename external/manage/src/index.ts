import { Context, Schema } from 'koishi';
import fs from 'fs';
import path from 'path';

export const name = 'manage';

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

const cfidsPath = path.join('D:', 'Koishi_project', 'pdxbot', 'external', 'monitor', 'src', 'cfids.json');
const supervisorsPath = path.join('D:', 'Koishi_project', 'pdxbot', 'supervisor.json');

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

  ctx.command('ad <cfid:string>', '添加一个cfid')
    .action(async ({ session }, cfid) => {
      if (!isSupervisor(session.userId)) return '您没有权限执行此操作。';

      const cfids = JSON.parse(fs.readFileSync(cfidsPath, 'utf8'));
      if (!cfids.includes(cfid)) {
        cfids.push(cfid);
        fs.writeFileSync(cfidsPath, JSON.stringify(cfids, null, 2));
        return `成功添加CFID: ${cfid}`;
      } else {
        return `${cfid} 已存在。`;
      }
    });

  ctx.command('del <cfid:string>', '删除指定cfid')
    .action(async ({ session }, cfid) => {
      if (!isSupervisor(session.userId)) return '您没有权限执行此操作。';

      let cfids = JSON.parse(fs.readFileSync(cfidsPath, 'utf8'));
      if (cfids.includes(cfid)) {
        cfids = cfids.filter(id => id !== cfid);
        fs.writeFileSync(cfidsPath, JSON.stringify(cfids, null, 2));
        return `成功删除CFID: ${cfid}`;
      } else {
        return `未找到CFID: ${cfid}。`;
      }
    });
}
