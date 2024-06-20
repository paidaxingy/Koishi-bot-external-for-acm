import { Context, Schema } from 'koishi';
import fs from 'fs';
import path from 'path';

export const name = 'manage';

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

const cfidsPath = path.join(__dirname, '../', '../', 'monitor-pdx', 'src', 'cfids.json');
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
  ctx.command('cqr', '查询所有CCSUcfid')
    .action(({ session }) => {
      const cfidNameMap = JSON.parse(fs.readFileSync(cfidsPath, 'utf8'));
      let result = '';
      for (let cfid in cfidNameMap) {
        result += cfid + ': ' + cfidNameMap[cfid] + '\n';
      }
      return result;
    });

  ctx.command('cad [...cfidNamePairs]', '批量添加CCSUCFID')
  .action(async ({ session }, ...cfidNamePairs) => {
    if (!isSupervisor(session.userId)) return '您没有权限执行此操作。';

    const cfidNameMap = JSON.parse(fs.readFileSync(cfidsPath, 'utf8'));
    let addedCfids = [];
    for (let i = 0; i < cfidNamePairs.length; i += 2) {
      let cfid = cfidNamePairs[i];
      let name = cfidNamePairs[i+1];
      if (!(cfid in cfidNameMap)) {
        cfidNameMap[cfid] = name;
        addedCfids.push(cfid);
      }
    }
    fs.writeFileSync(cfidsPath, JSON.stringify(cfidNameMap, null, 2));
    return addedCfids.length ? `成功添加 CFID: ${addedCfids.join(', ')}` : '没有新的 CFID 被添加。';
  });

ctx.command('cdel [...cfids]', '批量删除指定CCSUCFID')
  .action(async ({ session }, ...cfids) => {
    if (!isSupervisor(session.userId)) return '您没有权限执行此操作。';

    const cfidNameMap = JSON.parse(fs.readFileSync(cfidsPath, 'utf8'));
    let deletedCfids = [];
    cfids.forEach(cfid => {
      if (cfid in cfidNameMap) {
        delete cfidNameMap[cfid];
        deletedCfids.push(cfid);
      }
    });
    fs.writeFileSync(cfidsPath, JSON.stringify(cfidNameMap, null, 2));
    return deletedCfids.length ? `成功删除 CFID: ${deletedCfids.join(', ')}` : '未找到指定的 CFID。';
  });
  ctx.command('cmv <cfid> <name>', '修改指定CCSUCFID对应的名字')
    .action(async ({ session }, cfid, name) => {
      if (!isSupervisor(session.userId)) return '您没有权限执行此操作。';

      const cfidNameMap = JSON.parse(fs.readFileSync(cfidsPath, 'utf8'));
      if (!(cfid in cfidNameMap)) {
        return '未找到指定的 CFID。';
      }
      cfidNameMap[cfid] = name;
      fs.writeFileSync(cfidsPath, JSON.stringify(cfidNameMap, null, 2));
      return `成功修改 CFID: ${cfid}，新名字为: ${name}`;
    });
}
