import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { md5 } from "https://esm.sh/js-md5";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADSGRAM_SECRET = Deno.env.get("ADSGRAM_SECRET")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userid");
  const hash = url.searchParams.get("hash");
  
  const amount = parseInt(url.searchParams.get("amount") || "1000"); 

  if (!userId) {
    return new Response("Missing userid", { status: 400 });
  }

  if (ADSGRAM_SECRET) {
    const expectedHash = md5(`${userId}:${ADSGRAM_SECRET}`);
    if (hash !== expectedHash) {
      console.error(`Invalid signature for user ${userId}. Expected ${expectedHash}, got ${hash}`);
      return new Response("Forbidden", { status: 403 });
    }
  }

  console.log(`Processing verified reward for user ${userId}: ${amount} coins`);

  const { data, error } = await supabase.rpc("reward_ad_watch", {
    p_telegram_id: userId,
    p_reward_amount: amount
  });

  if (error) {
    console.error("Reward error:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }

  return new Response("OK", { status: 200 });
});
