import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const { userId, plan } = await request.json();
  
  if (!userId || !plan) {
    return NextResponse.json({ error: 'Missing userId or plan' }, { status: 400 });
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: existing } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ plan, status: 'active', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  } else {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({ user_id: userId, plan, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  }

  return NextResponse.json({ success: true, data: result });
}
