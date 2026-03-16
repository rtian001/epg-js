/**
 * EPG HTTP接口服务 (Node.js版本)
 * 接口: /epg?ch={频道名}&date={日期YYYY-MM-DD}
 * 返回: JSON格式节目单
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const xml2js = require('xml2js');

// 全局缓存
let epgData = {};
let channelNameMap = {}; // 频道名 -> channel id 映射

/**
 * 加载并解析EPG XML文件
 */
async function loadEpgData(xmlFile = 'e.xml') {
  console.log(`正在加载EPG数据: ${xmlFile}`);

  if (!fs.existsSync(xmlFile)) {
    throw new Error(`文件 ${xmlFile} 不存在`);
  }

  const xmlContent = fs.readFileSync(xmlFile, 'utf-8');
  const parser = new xml2js.Parser({ explicitArray: false });
  const data = await parser.parseStringPromise(xmlContent);

  // 解析频道信息
  let channelList = data.tv?.channel || [];
  if (!Array.isArray(channelList)) {
    channelList = [channelList];
  }

  for (const channel of channelList) {
    const channelId = channel['$']?.id || '';
    let displayNames = [];

    let displayNameData = channel['display-name'];
    if (!Array.isArray(displayNameData)) {
      displayNameData = displayNameData ? [displayNameData] : [];
    }

    for (const dn of displayNameData) {
      let name = '';
      if (typeof dn === 'string') {
        name = dn;
      } else if (typeof dn === 'object') {
        name = dn._ || '';
      }

      if (name) {
        displayNames.push(name);
        // 建立频道名到ID的映射（不区分大小写）
        channelNameMap[name.toLowerCase()] = channelId;
        channelNameMap[name] = channelId;
      }
    }
  }

  // 解析节目信息
  let programmeList = data.tv?.programme || [];
  if (!Array.isArray(programmeList)) {
    programmeList = programmeList ? [programmeList] : [];
  }

  for (const prog of programmeList) {
    const channelId = prog['$']?.channel || '';
    const start = prog['$']?.start || '';
    const stop = prog['$']?.stop || '';

    // 获取标题
    let title = '';
    const titleData = prog.title;
    if (typeof titleData === 'string') {
      title = titleData;
    } else if (typeof titleData === 'object' && titleData) {
      title = titleData._ || '';
    }

    if (channelId && start && stop && title) {
      if (!epgData[channelId]) {
        epgData[channelId] = [];
      }

      epgData[channelId].push({
        start: start,
        end: stop,
        title: title,
      });
    }
  }

  console.log(
    `EPG数据加载完成: ${Object.keys(channelNameMap).length} 个频道名, ${Object.keys(epgData).length} 个频道有节目数据`,
  );
}

/**
 * 解析EPG时间格式: 20260316000000 +0800
 */
function parseDateTime(dtStr) {
  try {
    // 提取日期和时间部分
    const dateStr = dtStr.substring(0, 8);
    const timeStr = dtStr.substring(8, 14);
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    const hour = parseInt(timeStr.substring(0, 2));
    const minute = parseInt(timeStr.substring(2, 4));
    const second = parseInt(timeStr.substring(4, 6));

    return new Date(year, month, day, hour, minute, second);
  } catch (e) {
    return null;
  }
}

/**
 * 获取指定频道和日期的节目单
 */
function getProgramsByDate(channelName, dateStr) {
  // 查找频道ID
  let channelId = null;

  // 直接匹配
  if (channelNameMap[channelName]) {
    channelId = channelNameMap[channelName];
  } else if (channelNameMap[channelName.toLowerCase()]) {
    channelId = channelNameMap[channelName.toLowerCase()];
  } else {
    // 模糊匹配
    for (const [name, cid] of Object.entries(channelNameMap)) {
      if (
        name.toLowerCase().includes(channelName.toLowerCase()) ||
        channelName.toLowerCase().includes(name.toLowerCase())
      ) {
        channelId = cid;
        break;
      }
    }
  }

  if (!channelId) {
    return { error: `频道未找到: ${channelName}` };
  }

  // 解析日期
  let queryDate;
  try {
    const dateParts = dateStr.split('-');
    if (dateParts.length !== 3) {
      throw new Error('日期格式错误');
    }
    queryDate = new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2]),
    );
    if (isNaN(queryDate.getTime())) {
      throw new Error('无效日期');
    }
  } catch (e) {
    return { error: `日期格式错误: ${dateStr}, 应为YYYY-MM-DD` };
  }

  const nextDate = new Date(queryDate);
  nextDate.setDate(nextDate.getDate() + 1);

  // 获取节目列表
  const programs = epgData[channelId] || [];

  // 筛选指定日期的节目
  const filteredPrograms = [];
  for (const prog of programs) {
    const progStart = parseDateTime(prog.start);
    const progEnd = parseDateTime(prog.end);

    if (progStart) {
      const progDate = new Date(
        progStart.getFullYear(),
        progStart.getMonth(),
        progStart.getDate(),
      );
      const queryDateOnly = new Date(
        queryDate.getFullYear(),
        queryDate.getMonth(),
        queryDate.getDate(),
      );
      const nextDateOnly = new Date(
        nextDate.getFullYear(),
        nextDate.getMonth(),
        nextDate.getDate(),
      );

      if (progDate >= queryDateOnly && progDate < nextDateOnly) {
        filteredPrograms.push({
          start: progStart.toTimeString().substring(0, 5),
          end: progEnd ? progEnd.toTimeString().substring(0, 5) : '',
          title: prog.title,
        });
      }
    }
  }

  return {
    channel_name: channelName,
    date: dateStr,
    epg_data: filteredPrograms,
  };
}

/**
 * 获取所有频道列表
 */
function getChannels() {
  const channels = {};
  for (const [name, cid] of Object.entries(channelNameMap)) {
    if (!channels[cid]) {
      channels[cid] = {
        id: cid,
        names: [],
      };
    }
    if (!channels[cid].names.includes(name)) {
      channels[cid].names.push(name);
    }
  }

  return Object.values(channels);
}

/**
 * 发送JSON响应
 */
function sendJsonResponse(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data, null, 2));
}

/**
 * 创建HTTP服务器
 */
function createServer() {
  return http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const query = parsedUrl.query;

    // 处理OPTIONS请求 (CORS预检)
    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    // 只处理GET请求
    if (req.method !== 'GET') {
      sendJsonResponse(res, { error: 'Method Not Allowed' }, 405);
      return;
    }

    switch (path) {
      case '/epg':
        handleEpgRequest(res, query);
        break;

      case '/channels':
        sendJsonResponse(res, getChannels());
        break;

      case '/':
        sendJsonResponse(res, {
          name: 'EPG API',
          version: '1.0',
          endpoints: {
            '/epg': {
              method: 'GET',
              params: {
                ch: '频道名称 (必填)',
                date: '日期格式YYYY-MM-DD (可选,默认为今天)',
              },
              example: '/epg?ch=CCTV1&date=2026-03-13',
            },
            '/channels': {
              method: 'GET',
              description: '获取所有频道列表',
            },
          },
        });
        break;

      default:
        sendJsonResponse(res, { error: 'Not Found' }, 404);
    }
  });
}

/**
 * 处理EPG请求
 */
function handleEpgRequest(res, query) {
  const channel = query.ch || '';
  let dateStr = query.date || '';

  // 如果没有指定日期，使用当前日期
  if (!dateStr) {
    const now = new Date();
    dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  if (!channel) {
    sendJsonResponse(
      res,
      {
        error: '缺少channel_name参数: ch (例如: ?ch=CCTV1&date=2026-03-13)',
      },
      400,
    );
    return;
  }

  const response = getProgramsByDate(channel, dateStr);

  if (response.error) {
    sendJsonResponse(res, response, 404);
  } else {
    sendJsonResponse(res, response);
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    // 加载EPG数据
    await loadEpgData();

    // 创建并启动HTTP服务器
    const server = createServer();
    const port = 8080;

    server.listen(port, '0.0.0.0', () => {
      console.log(`\nEPG服务已启动:`);
      console.log(
        `  接口地址: http://localhost:${port}/epg?ch=CCTV1&date=2026-03-13`,
      );
      console.log(`  频道列表: http://localhost:${port}/channels`);
      console.log(`  API文档:  http://localhost:${port}/`);
      console.log(`\n按 Ctrl+C 停止服务`);
    });

    // 优雅关闭
    process.on('SIGINT', () => {
      console.log('\n服务已停止');
      server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
}

// 启动服务
main();
