const { fetchRssNews } = require('./lib/news');

async function testRss() {
  console.log('开始测试RSS抓取...');
  try {
    const news = await fetchRssNews(5);
    console.log(`获取到 ${news.length} 条新闻`);
    if (news.length > 0) {
      console.log('前3条新闻:');
      news.slice(0, 3).forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`);
        console.log(`   来源: ${item.source}`);
        console.log(`   发布时间: ${item.published_at}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('错误:', error);
  }
}

testRss();