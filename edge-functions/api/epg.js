export default function onRequest(context) {
    const data = {
        success: true,
        message: 'Hello from Epg!',
        channel: 'CCTV1'
    };
    return new Response(JSON.stringify(data), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
