import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('generation_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[History] Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    return NextResponse.json({ records: data });
  } catch (error) {
    console.error('[History] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First get the record to find storage_path
    const { data: record } = await supabase
      .from('generation_history')
      .select('storage_path')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    // Delete from storage if path exists
    if (record?.storage_path) {
      await supabase.storage
        .from('coloring-pages')
        .remove([record.storage_path]);
    }

    // Delete from database
    const { error } = await supabase
      .from('generation_history')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('[History] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[History] Delete error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const imageBuffer = await imageFile.arrayBuffer();
    const timestamp = Date.now();
    const filePath = `${userId}/colored-${timestamp}.png`;

    const { error: uploadError } = await supabase.storage
      .from('coloring-pages')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('[History] Upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from('coloring-pages')
      .getPublicUrl(filePath);

    await supabase
      .from('generation_history')
      .insert({
        user_id: userId,
        prompt: 'Colored version',
        style: 'colored',
        image_url: urlData.publicUrl,
        storage_path: filePath,
      });

    return NextResponse.json({ success: true, url: urlData.publicUrl });
  } catch (error) {
    console.error('[History] POST error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}