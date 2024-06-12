import { Context, Schema } from 'koishi';
import axios from 'axios'; // 确保已经安装axios

export const name = 'query-phone';

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
  ctx.command('query <qq:string>', '查询QQ绑定的手机号信息')
    .action(async ({ session }, qq) => {
      if (!qq) {
        console.log('no qq number');
        session.send('请输入QQ号。');
        return;
      }

      console.log('get_query');
      const apiUrl = `https://zy.xywlapi.cc/qqapi?qq=${qq}`;
      try {
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data.status === 200) {
          const reply = `Phone: ${data.phone}\nPhone Region: ${data.phonediqu}`;
          session.send(reply);
        } else {
          session.send('未查到。');
        }
      } catch (error) {
        console.error('API请求失败', error);
        session.send('查询失败。');
      }
    });
}
