const { supabase } = require('./lib/supabase');

async function testStats() {
  console.log('Testing stats API...');
  
  // Get current date in ISO format
  const today = new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z';
  console.log('Today:', today);
  
  // Test signals count
  const { data: signals, error: signalsError } = await supabase
    .from('signals')
    .select('id, created_at')
    .limit(5);
  
  if (signalsError) {
    console.error('Error getting signals:', signalsError);
  } else {
    console.log('Recent signals:', signals);
  }
  
  // Test today's signals count
  const { count: signalsCount, error: countError } = await supabase
    .from('signals')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today);
  
  if (countError) {
    console.error('Error counting signals:', countError);
  } else {
    console.log('Today\'s signals count:', signalsCount);
  }
  
  // Test news count
  const { count: newsCount, error: newsError } = await supabase
    .from('news')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today);
  
  if (newsError) {
    console.error('Error counting news:', newsError);
  } else {
    console.log('Today\'s news count:', newsCount);
  }
}

testStats().catch(console.error);