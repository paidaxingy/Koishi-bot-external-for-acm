import { Context, Schema } from 'koishi'

export const name = 'passed-the-exam'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

function removeQueryParameters(url: string): string {// 将分享之类的无用的参数去掉
  var index = url.indexOf('?share');
  if (index !== -1) {
      return url.substring(0, index);
  }
  index = url.indexOf('?app');
  if (index !== -1) {
      return url.substring(0, index);
  }
  return url;
}

function decodeHtmlEntities(text: string): string {// 解析 prompt 里面的东西
  const entities: { [key: string]: string } = {
      "&quot;": '"',
      "&#39;": "'",
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
  };
  return text.replace(/&quot;|&#39;|&amp;|&lt;|&gt;/g, match => entities[match]);
}

export function apply(ctx: Context) {
    ctx.on('message', (session) => {
      console.log(session.content);
      if(session.content.includes('<json data="{')){
        const str = session.content;
        var matchedData = str.match(/data="([^"]+)"/)?.[1];
        if (!matchedData) {
            console.log("No data attribute found or other extraction error.");
            session.send("出问题了!\n" + session.content);
        }
            

        // 使用 decodeHtmlEntities 解码
        matchedData = decodeHtmlEntities(matchedData);

        // 解析JSON字符串
        let jsonData;
        try {
            jsonData = JSON.parse(matchedData);
            console.log("Parsed JSON:", jsonData); // 打印 JSON 对象
        } catch (error) {
            console.log("JSON parsing error:", error);
            session.send("JSON解析出问题了!\n" + matchedData);
            return;
        }

        // 提取 'prompt' 字段的值
        var promptValue = jsonData.prompt.replace(/\[.*?\]/g, '');

        // 检查 'app' 或 'ver' 字段来确定如何提取URL
        let url: string | undefined;

        if ('app' in jsonData) {
            url = jsonData.meta?.news?.jumpUrl || jsonData.meta?.detail_1?.qqdocurl;
            session.send('网址:\n' + promptValue + removeQueryParameters(url));
        } else if ('ver' in jsonData) {
            url = jsonData.meta?.news?.jumpUrl || jsonData.meta?.detail_1?.qqdocurl;
            session.send('小程序:\n' + promptValue + removeQueryParameters(url));
        } else {
            session.send('pass出了问题!!!!');
        }
        // session.send(jumpUrl);
        // // session.send('刷着刷着就考上了');
      }    
    })
}
