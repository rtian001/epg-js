export default async function onRequest(context) {
  // 通过相对路径读取同目录下的JSON文件
  const data = await import('/epg-2026-03-21.json', {
    assert: { type: 'json' }
  });
  return new Response(JSON.stringify(data.default), {
    headers: { 'Content-Type': 'application/json' }
  });
}
