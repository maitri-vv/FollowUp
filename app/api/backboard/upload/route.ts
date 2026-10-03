import { NextResponse } from 'next/server';

export async function POST(req:Request){
  const key=process.env.BACKBOARD_API_KEY;
  if(!key)return NextResponse.json({error:'BACKBOARD_API_KEY is not configured.'},{status:400});
  const form=await req.formData();
  const file=form.get('file');
  const assistantId=String(form.get('assistantId')||process.env.BACKBOARD_ASSISTANT_ID||'');
  if(!(file instanceof File)||!assistantId)return NextResponse.json({error:'A file and assistantId are required.'},{status:400});
  const out=new FormData();out.append('file',file,file.name);
  const r=await fetch(`https://app.backboard.io/api/assistants/${assistantId}/documents`,{method:'POST',headers:{'X-API-Key':key},body:out});
  const data=await r.json();if(!r.ok)return NextResponse.json({error:data?.detail||'Backboard upload failed.'},{status:r.status});
  return NextResponse.json(data);
}
