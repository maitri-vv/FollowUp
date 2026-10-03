import { NextResponse } from 'next/server';

const BASE='https://app.backboard.io/api';
const headers=()=>({'X-API-Key':process.env.BACKBOARD_API_KEY||'','Content-Type':'application/json'});

export async function GET(){
  if(!process.env.BACKBOARD_API_KEY)return NextResponse.json({configured:false});
  return NextResponse.json({configured:true,assistantId:process.env.BACKBOARD_ASSISTANT_ID||null});
}

export async function POST(){
  const key=process.env.BACKBOARD_API_KEY;
  if(!key)return NextResponse.json({error:'BACKBOARD_API_KEY is missing.'},{status:400});
  if(process.env.BACKBOARD_ASSISTANT_ID)return NextResponse.json({assistantId:process.env.BACKBOARD_ASSISTANT_ID});
  const r=await fetch(`${BASE}/assistants`,{method:'POST',headers:headers(),body:JSON.stringify({name:'FollowUp — Dad Memory Assistant',system_prompt:'You are FollowUp, a family memory assistant. Answer only from supplied memory/document evidence. Never invent dates, amounts, names or sources. Keep answers concise and cite the source when possible.',tok_k:8})});
  const data=await r.json(); if(!r.ok)return NextResponse.json({error:data?.detail||'Could not create Backboard assistant.'},{status:r.status});
  return NextResponse.json({assistantId:data.assistant_id});
}
