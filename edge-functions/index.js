export default async function onRequest(context) {
  const req = context.request;
  const url = new URL(req.url);
  const search = url.search;
  const params = new URLSearchParams(search);
  const channel = params.get('ch') || 'cctv1';
  let _channel=channel.toLowerCase();
  const currentDate = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const date = params.get('date') || currentDate;
  const host = req.headers.get('host');
  let epgData = [{
    start: '00:00',
    end: '02:59',
    title: '精彩节目'
  }, {
    start: '03:00',
    end: '05:59',
    title: '精彩节目'
  }, {
    start: '06:00',
    end: '08:59',
    title: '精彩节目'
  }, {
    start: '09:00',
    end: '11:59',
    title: '精彩节目'
  }, {
    start: '12:00',
    end: '14:59',
    title: '精彩节目'
  }, {
    start: '15:00',
    end: '17:59',
    title: '精彩节目'
  }, {
    start: '18:00',
    end: '20:59',
    title: '精彩节目'
  }, {
    start: '21:00',
    end: '23:59',
    title: '精彩节目'
  }];
  try{
    const eJson = await fetch(`https://${host}/epg-${date}.json`);
    if (eJson.ok) {
      const eJsonData = await eJson.json();
      if (_channel.startsWith('cctv')) {
        _channel = _channel.replace(/-/g, '').replace(/[^\x00-\xff]/g, '');
      } else if (_channel.endsWith('台')) {
        _channel = _channel.slice(0, -1);
      } else if (_channel.endsWith('频道')) {
        _channel = _channel.slice(0, -2);
      };
      if(_channel=='凤凰卫视'){
          _channel='凤凰中文'
      }
      epgData = eJsonData[_channel] || epgData;
    }
  }catch(err){
      epgData={"date":filename,"error":err.name,"message":err.message}
  }

  const result = {
    'date': date,
    'channel_name': channel,
    'epg_data': epgData
  };
  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
