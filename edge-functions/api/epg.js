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
    let epgData = [];
    const eJson = await fetch(`https://${host}/epg-${date}.json`);
    const eJsonData = await eJson.json();
    epgData = eJsonData[channel];
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
