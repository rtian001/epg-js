export default async function onRequest(context) {
  const query = context.request.url.split('?')[1];
  const params = new URLSearchParams(query);
  const channel = params.get('ch') || 'cctv1';
  const currentDate = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');

  const date = params.get('date') || currentDate;
  const eJson = context.waitUntil(fetch('./e.json'));
  const eJsonData = await eJson.json();
  const epgData = eJsonData[channel][date];
  const data = {
    'channel_name': channel,
    'date': date,
    'epg_data': epgData,
  };
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
