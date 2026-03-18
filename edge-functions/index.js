export default async function onRequest(context) {
  const req = context.request;
  const url = new URL(req.url);
  const search = url.search;
  // const query = context.request.url.split('?')[1];
  const params = new URLSearchParams(search);
  const channel = params.get('ch') || 'cctv1';
  const currentDate = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const date = params.get('date') || currentDate;
  const host = req.headers.get('host');
  var epgData = [{
    start: '00:00',
    end: '23:59',
    title: '精彩节目'
  }];
  try {
    const eJson = await fetch(`https://${host}/epg-${date}.json`);
    const eJsonData = await eJson.json();
    if (!eJsonData[channel]) {
      channel = '未知频道';
    } else {
      epgData = eJsonData[channel];
    }
  } catch (error) {
    console.log(JSON.stringify({ error: 'Internal Server Error' }));
    channel = '未知频道';
  }

  const result = {
    'date': date,
    'channel_name': channel,
    'epg_data': epgData
  };
  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
  });


  //default  
}
