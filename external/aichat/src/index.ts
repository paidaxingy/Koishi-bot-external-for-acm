import { Context, Schema } from 'koishi';
import axios from 'axios';

export const name = 'aichat';

export interface Config { }

export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
  ctx.command('chat4 <question:text>', '与GPT4进行聊天')
    .action(async ({ session }, question) => {
      var str = '<quote id="'+session.messageId+'"/>';
      if(session.guild)
        str = str + '<at id="'+session.userId+'"/> ' ;
      if (!question) {
        return  str + '请输入你想问的问题。';
      }
      var url,headers,data;
      url = "https://api";
      headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer xxxxx"
      };
      data = {
        model: "gpt-4o-all",
        messages: [
          { role: "system", content: "Please reply in Chinese." },
          { role: "user", content: question }
        ]
      };
      try {
        const response = await axios.post(url, data, { headers: headers });

        if (response.status === 200) {
          const reply = response.data.choices[0].message.content;
          console.log(str + reply)
          return str + reply;
        } else {
          console.error('请求失败:', response.status, response.statusText); 
          return '抱歉，无法获取AI的回答。';
        }
      } catch (error) {
        console.error(error);
        return '抱歉，出现了一些问题。';
      }
    });
  ctx.command('chat <question:text>', '与GPT3.5进行聊天')
    .action(async ({ session }, question) => {
      var str = '<quote id="'+session.messageId+'"/>';
      console.log(session.guild)
      if(session.guild)
        str = str + '<at id="'+session.userId+'"/> ' ;
      if (!question) {
        return  str + '请输入你想问的问题。';
      }
      var url,headers,data;
      url = "https://api";
      data = {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: question }],
        safe_mode: false
      };
      headers = {
        "Authorization": "Bearer xxxxx",
        "Content-Type": "application/json"
      };
      try {
        const response = await axios.post(url, data, { headers: headers });

        if (response.status === 200) {
          const reply = response.data.choices[0].message.content;
          console.log(str + reply)
          return str + reply;
        } else {
          console.error('请求失败:', response.status, response.statusText);
          return '抱歉，无法获取AI的回答。';
        }
      } catch (error) {
        console.error(error);
        return '抱歉，出现了一些问题。';
      }
    });
}
