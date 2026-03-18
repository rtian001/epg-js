// 文件路径 ./edge-functions/api/hello.js
// 访问路径 example.com/api/hello
export default function onRequest(context) {
  return new Response(JSON.stringify({ 'message': 'Hello from Epg!',success: true }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
