const fs = require('fs');

const xmlData = fs.readFileSync('e.xml', 'utf-8');

const csvRows = [];
csvRows.push('channel,date,start,end,programe');

const channels = {};
const channelMatches = xmlData.matchAll(/<channel id="([^"]+)">[\s\S]*?<display-name[^>]*>([^<]+)<\/display-name>/g);
for (const match of channelMatches) {
  channels[match[1]] = match[2];
}

const programmeMatches = xmlData.matchAll(/<programme start="([^"]+)" stop="([^"]+)" channel="([^"]+)">[\s\S]*?<title[^>]*>([^<]*)<\/title>/g);
for (const match of programmeMatches) {
  const startStr = match[1];
  const endStr = match[2];
  const channelId = match[3];
  const title = match[4];

  const channelName = channels[channelId] || channelId;

  const startDate = startStr.substring(0, 8);
  const startTime = startStr.substring(8, 12);
  const endTime = endStr.substring(8, 12);

  const startHHMM = `${startTime.substring(0, 2)}:${startTime.substring(2, 4)}`;
  const endHHMM = `${endTime.substring(0, 2)}:${endTime.substring(2, 4)}`;

  csvRows.push(`${channelName},${startDate},${startHHMM},${endHHMM},${title}`);
}

const csvContent = csvRows.join('\n');
fs.writeFileSync('e.csv', csvContent, 'utf-8');
console.log('转换完成！已生成 e.csv');
console.log(`共转换 ${csvRows.length - 1} 条节目记录`);
