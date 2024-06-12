import { Context, Schema } from 'koishi';
import axios from 'axios';

export const name = 'aichat';

export interface Config { }

export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
  ctx.command('chat <question:text>', '与AI进行聊天')
    .action(async ({ session }, question) => {
      if (!question) {
        return '请输入你想问的问题。';
      }

      try {
        const { data } = await axios.post('xxxxxxx', {
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: question }],
          safe_mode: false
        }, {
          headers: {
            'Authorization': 'Bearer xxxxxx',
            'Content-Type': 'application/json'
          }
        });

        const reply = data.choices[0].message.content;
        return reply;
      } catch (error) {
        console.error(error);
        return '抱歉，无法获取AI的回答。';
      }
    });
}
