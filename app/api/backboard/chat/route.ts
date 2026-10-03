import { NextResponse } from 'next/server';

export async function POST(req:Request){
  const key=process.env.BACKBOARD_API_KEY;
  if(!key)return NextResponse.json({error:'BACKBOARD_API_KEY is not configured on the server.'},{status:400});
  const body=await req.json();
  const memories=Array.isArray(body.memories)?body.memories.slice(0,8):[];
  const context=memories.map((m:any,i:number)=>`[SOURCE ${i+1}] ${m.sourceName} | ${m.sender||'unknown'} | ${m.group||''} | ${m.date||'undated'}\n${m.text}`).join('\n\n');
  const content=`Use only this selected memory context to answer the question. If the evidence is insufficient, say so.\n\nMEMORY CONTEXT:\n${context||'(none)'}\n\nQUESTION: ${String(body.query||'')}`;
  const headers={'X-API-Key':key,'Content-Type':'application/json'};
  const payload:any={content,stream:false,memory:'Readonly',memory_citation:true};
  if(process.env.BACKBOARD_ASSISTANT_ID)payload.assistant_id=process.env.BACKBOARD_ASSISTANT_ID;
  const r=await fetch('https://app.backboard.io/api/threads/messages',{method:'POST',headers,body:JSON.stringify(payload)});
  const data=await r.json();
  if(!r.ok)return NextResponse.json({error:data?.detail||'Backboard request failed.'},{status:r.status});
  return NextResponse.json({answer:data?.content||data?.message?.content||'Backboard returned no text.',threadId:data?.thread_id,assistantId:data?.assistant_id});
}
