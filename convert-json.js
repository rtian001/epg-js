const fs = require('fs');

const xmlData = fs.readFileSync('e.xml', 'utf-8');

const channels = {};
const channelMatches = xmlData.matchAll(/<channel id="([^"]+)">[\s\S]*?<display-name[^>]*>([^<]+)<\/display-name>/g);
for (const match of channelMatches) {
  channels[match[1]] = match[2];
}

const result = {};

const programmeMatches = xmlData.matchAll(/<programme start="([^"]+)" stop="([^"]+)" channel="([^"]+)">[\s\S]*?<title[^>]*>([^<]*)<\/title>/g);
for (const match of programmeMatches) {
  const startStr = match[1];
  const endStr = match[2];
  const channelId = match[3];
  const title = match[4];

  const channelName = channels[channelId] || channelId;
  const channelKey = channelName.toLowerCase().replace(/\s+/g, '');

  const date = `${startStr.substring(0, 4)}-${startStr.substring(4, 6)}-${startStr.substring(6, 8)}`;
  const startTime = startStr.substring(8, 12);
  const endTime = endStr.substring(8, 12);

  const startHHMM = `${startTime.substring(0, 2)}:${startTime.substring(2, 4)}`;
  const endHHMM = `${endTime.substring(0, 2)}:${endTime.substring(2, 4)}`;

  if (!result[date]) {
    result[date] = {};
  }

  if (!result[date][channelKey]) {
    result[date][channelKey] = [];
  }

  result[date][channelKey].push({
    start: startHHMM,
    end: endHHMM,
    title: title
  });
}

let cdate = [0, 0];
for (let d in result) {
  dd = Object.keys(result[d]).length;
  if (dd > cdate[1]) {
    cdate[1] = dd;
    cdate[0] = d;
  }
}

today = cdate[0];
const jsonContent = JSON.stringify(result[today]);
fs.writeFileSync(`epg-${today}.json`, jsonContent, 'utf-8');
console.log(`转换完成！已生成 epg-${today}.json`);

const channelCount = Object.values(result).reduce((sum, channels) => sum + Object.keys(channels).length, 0);
console.log(`共转换 ${channelCount} 个频道`);
console.log(`文件大小：${(fs.statSync(`epg-${today}.json`).size / 1024 / 1024).toFixed(2)} MB`);
