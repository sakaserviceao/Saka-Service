import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zldaauprystajzxfypmc.supabase.co';
const supabaseAnonKey = 'sb_publishable_UL092Ntw48HFNYn9U-49VQ_xIwhQ42k';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("=== Checking Reviews ===");
  const { data: reviews, error: reviewError } = await supabase.from('reviews').select('*');
  console.log("Reviews:", reviews?.length || 0);
  if (reviews && reviews.length > 0) {
      console.log(reviews[0]);
  }
  if (reviewError) console.error("Review Error:", reviewError);

  console.log("\n=== Testing record_profile_visit ===");
  const { data: profiles } = await supabase.from('professionals').select('id, total_views').limit(1);
  if (profiles && profiles.length > 0) {
    const proId = profiles[0].id;
    console.log("Profile total_views before:", profiles[0].total_views);
    
    const { error: rpcError } = await supabase.rpc('record_profile_visit', {
      visited_user_id: proId,
      visitor_user_id: null
    });
    console.log("RPC Error:", rpcError);
    
    const { data: updated } = await supabase.from('professionals').select('id, total_views').eq('id', proId).single();
    console.log("Profile total_views after RPC:", updated?.total_views);
  } else {
    console.log("No profiles found to test RPC.");
  }
}

main();
