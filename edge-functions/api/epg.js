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
    let eJsonData = {};
    const eJson = await fetch(`https://${host}/epg-${date}.json`);
    if (eJson.ok) {
        eJsonData = await eJson.json();
        epgData = eJsonData[channel] || epgData;
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
