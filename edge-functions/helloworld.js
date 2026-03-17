// 文件路径 ./edge-functions/api/hello.js
// 访问路径 example.com/api/hello
export default function onRequest(context) {
  return new Response({ 'message': 'Hello from Epg!' }, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
