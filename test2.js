import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zldaauprystajzxfypmc.supabase.co';
const supabaseAnonKey = 'sb_publishable_UL092Ntw48HFNYn9U-49VQ_xIwhQ42k';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("=== Testing Relation ===");
  const { data: pros, error: proError } = await supabase.from('professionals').select('id, name, reviews(*)').eq('id', 'c7d62147-cb08-45c1-aa25-8dd3f3ab3b0d');
  console.log("Error:", proError);
  console.log("Pros:", JSON.stringify(pros, null, 2));
}

main();
