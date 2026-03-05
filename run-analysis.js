fetch('http://localhost:3002/api/analyze/run', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ page_size: 5 })
})
.then(response => response.json())
.then(data => {
  console.log('分析结果:', data);
  process.exit(0);
})
.catch(error => {
  console.error('错误:', error);
  process.exit(1);
});