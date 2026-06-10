import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const { action } = await request.json();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (action === 'clean_old_test_user') {
    // 删除旧的test环境遗留记录
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', 'user_3EpuwbL8mDhAbwNiwTWffuBx8xj');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: 'Old test user record deleted' });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
