'use client';

import { useEffect, useMemo, useState } from 'react';
import { parseFile } from '@/lib/parser';
import { sampleMemories } from '@/lib/sample';
import { clearMemories, loadMemories, saveMemories } from '@/lib/idb';
import { answerWithGemma, embedText, semanticSearch, loadGenerator, MODEL } from '@/lib/local-ai';
import { lexicalSearch } from '@/lib/retrieval';
import { Memory, SearchHit } from '@/lib/types';

type View='home'|'memories'|'upcoming'|'offers';
type Mode='private'|'assisted';

const DEMO_QUESTIONS=['When is the society payment due?','Who sent me the AC offer?','Where did I get the quotation?','What am I forgetting?'];

export default function FollowUpApp(){
  const [memories,setMemories]=useState<Memory[]>([]);
  const [view,setView]=useState<View>('home');
  const [mode,setMode]=useState<Mode>('private');
  const [query,setQuery]=useState('');
  const [answer,setAnswer]=useState('');
  const [hits,setHits]=useState<SearchHit[]>([]);
  const [status,setStatus]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [ready,setReady]=useState(false);
  const [backboardReady,setBackboardReady]=useState(false);

  useEffect(()=>{loadMemories().then(setMemories).catch(()=>{}); fetch('/api/backboard/setup').then(r=>r.json()).then(x=>setBackboardReady(!!x.configured)).catch(()=>{});},[]);

  const counts=useMemo(()=>({all:memories.length,upcoming:memories.filter(m=>['deadline','payment','renewal','request'].includes(m.category)).length,offers:memories.filter(m=>m.category==='offer').length}),[memories]);

  async function importFiles(files:FileList|null){
    if(!files?.length)return;
    setError('');setBusy(true);setStatus('Reading your files…');
    try{
      const parsed=(await Promise.all(Array.from(files).map(parseFile))).flat();
      const withEmbeddings:Memory[]=[];
      for(let i=0;i<parsed.length;i++){
        setStatus(`Indexing ${i+1}/${parsed.length} locally…`);
        try{withEmbeddings.push({...parsed[i],embedding:await embedText(parsed[i].text,setStatus)});}catch{withEmbeddings.push(parsed[i]);}
      }
      await saveMemories(withEmbeddings);setMemories(prev=>[...prev,...withEmbeddings]);setStatus(`${withEmbeddings.length} memories indexed on this device.`);
    }catch(e){setError('Could not import that file. Try a WhatsApp .txt export, .json, .md, .csv, or an image.');}
    finally{setBusy(false);}
  }

  async function loadDemo(){
    setBusy(true);setError('');
    try{
      const indexed=[] as Memory[];
      for(let i=0;i<sampleMemories.length;i++){setStatus(`Preparing demo memory ${i+1}/${sampleMemories.length}…`);indexed.push({...sampleMemories[i],embedding:await embedText(sampleMemories[i].text,setStatus)});}
      await saveMemories(indexed);setMemories(indexed);setStatus('Demo memories loaded. Nothing left this browser.');
    }catch{setError('The local embedding model could not load. Try Chrome/Edge with WebGPU enabled.');}
    finally{setBusy(false);}
  }

  async function runQuery(q=query){
    const question=q.trim(); if(!question)return;
    setQuery(question);setError('');setBusy(true);setAnswer('');setHits([]);setStatus('Searching your memories locally…');
    try{
      let found:SearchHit[]=[];
      const hasEmbeddings=memories.some(m=>m.embedding?.length);
      if(hasEmbeddings) found=await semanticSearch(memories,question,setStatus,8);
      if(found.length<3){const lexical=lexicalSearch(memories,question,8);const ids=new Set(found.map(x=>x.id));found=[...found,...lexical.filter(x=>!ids.has(x.id))].slice(0,8);}
      setHits(found);
      if(question.toLowerCase().includes('forget')){
found=[...memories.filter(m=>['deadline','payment','renewal','request','offer'].includes(m.category)).map(m=>({...m,score:0})), ...found].filter((m,i,a)=>a.findIndex(x=>x.id===m.id)===i).slice(0,8);        setHits(found);
      }
      if(mode==='assisted'){
        if(!backboardReady) throw new Error('Assisted Mode is not configured yet. Add BACKBOARD_API_KEY on the server first.');
        setStatus('Asking Backboard using only the selected memory context…');
        const res=await fetch('/api/backboard/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query:question,memories:found.map(({embedding,...m})=>m)})});
        const data=await res.json(); if(!res.ok)throw new Error(data.error||'Backboard request failed.');
        setAnswer(data.answer||'No answer returned.');
      }else{
        setStatus('Loading private Gemma only on this device…');
        if(!ready){await loadGenerator(setStatus);setReady(true);}
        if(found.length) setAnswer(await answerWithGemma(question,found,setStatus));
        else setAnswer('I could not find enough evidence in FollowUp to answer that. Try a different phrase or import more history.');
      }
      setStatus('');
    }catch(e:any){setError(e?.message||'Something went wrong.');setStatus('');}
    finally{setBusy(false);}
  }

  async function reset(){await clearMemories();setMemories([]);setHits([]);setAnswer('');setStatus('Memory cleared from this browser.');setReady(false);}

  return <main className="shell">
    <header className="top">
      <div className="brand"><div className="mark">F</div><div><h1>FollowUp</h1><small>for the things Dad needs to act on</small></div></div>
      <div className="privacy"><span className="dot"/> {mode==='private'?'PRIVATE · LOCAL ONLY':'ASSISTED · SELECTED DATA SHARED'}</div>
    </header>

    <section className="hero">
      <div className="heroCard">
        <div className="eyebrow">A memory assistant for Dad</div>
        <h2>Dad remembers the thing. FollowUp remembers what he needs to do about it.</h2>
        <p>Search the WhatsApp messages, notes, documents and screenshots that normally disappear into a pile of chats. Start with Private Mode: your imported memories stay in this browser.</p>
      </div>
      <div className="heroSide panel">
        <div>
          <div className="eyebrow">AI mode</div>
          <div className={`mode ${mode==='private'?'active':''}`}><strong>Private · Gemma</strong><span>Open-weight Gemma runs on the device through Transformers.js. No API key. No server-side memory.</span></div>
          <div className={`mode ${mode==='assisted'?'active':''}`}><strong>Assisted · Backboard</strong><span>Optional hosted RAG for selected context. Only turn this on when you explicitly want to share data.</span></div>
          <div className="toggle"><button className={mode==='private'?'on':''} onClick={()=>setMode('private')}>Private</button><button className={mode==='assisted'?'on':''} onClick={()=>setMode('assisted')}>Assisted</button></div>
        </div>
        <div className="stats"><div className="stat"><b>{counts.all}</b><span>memories</span></div><div className="stat"><b>{counts.upcoming}</b><span>actionable</span></div><div className="stat"><b>{counts.offers}</b><span>offers</span></div></div>
      </div>
    </section>

    <section className="layout">
      <aside className="sidebar">
        {(['home','memories','upcoming','offers'] as View[]).map(v=><button key={v} className={`navbtn ${view===v?'active':''}`} onClick={()=>setView(v)}>{v==='home'?'⌂  Ask FollowUp':v==='memories'?`▦  All memories · ${counts.all}`:v==='upcoming'?`◷  Things to act on · ${counts.upcoming}`:`✦  Offers · ${counts.offers}`}</button>)}
        <hr/>
        <label className="importBox"><strong>+ Import memories</strong><p>WhatsApp .txt/.json, notes, documents, CSV or screenshots. Files are parsed and indexed locally in Private Mode.</p><input className="file" type="file" multiple accept=".txt,.json,.jsonl,.md,.csv,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" onChange={e=>importFiles(e.target.files)}/></label>
        <button className="navbtn" onClick={loadDemo} disabled={busy}>Load demo Dad data</button>
        <button className="navbtn" onClick={reset}>Clear this browser</button>
      </aside>

      <div className="main">
        {error&&<div className="notice error">{error}</div>}
        {status&&<div className="loadbar">{status}</div>}

        {view==='home'&&<>
          <div className="query"><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&runQuery()} placeholder="Ask something Dad would normally ask you…"/><button className="primary" onClick={()=>runQuery()} disabled={busy}>Find it</button></div>
          <div className="panel" style={{marginBottom:14}}><div className="eyebrow">Try these</div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{DEMO_QUESTIONS.map(q=><button className="secondary" key={q} onClick={()=>runQuery(q)}>{q}</button>)}</div></div>
          {(answer||hits.length>0)&&<div className="panel answer"><div className="answerTop"><h3>FollowUp found</h3><span className="tag">{mode==='private'?'Gemma · local':'Backboard · assisted'}</span></div><div className="answerText">{answer||'Here are the memories that look relevant.'}</div><div className="sourceGrid">{hits.slice(0,4).map(h=><div className="source" key={h.id}><div className="sourceHead"><span>{h.sender||h.sourceName}{h.group?` · ${h.group}`:''}</span><span>{h.date||'undated'}</span></div><p>{h.text}</p></div>)}</div></div>}
          {!memories.length&&<div className="grid"><div className="panel"><h3>What is Dad forgetting?</h3><p className="sub">FollowUp turns buried messages into things worth acting on.</p><div className="memory"><div className="memoryMeta"><span>PAYMENT</span><span>7 OCT</span></div><div className="memoryText">Society maintenance · ₹4,800 · Green View Society</div></div><div className="memory"><div className="memoryMeta"><span>OFFER</span><span>12 OCT</span></div><div className="memoryText">Rajesh · Voltas AC service offer</div></div><div className="memory"><div className="memoryMeta"><span>REQUEST</span><span>FRI</span></div><div className="memoryText">Send electricity bill PDF for society records</div></div></div><div className="panel"><h3>Built around the real problem</h3><p className="sub">Not “AI that remembers your life.” A way to find the source of the thing Dad already remembers.</p><div className="notice success">Private Mode keeps imported memory in IndexedDB and performs local retrieval + Gemma inference in the browser.</div><div className="notice">The public demo uses synthetic memories. Don't upload Dad's real history to a public deployment unless you intentionally choose Assisted Mode.</div></div></div>}
        </>}

        {view!=='home'&&<div className="panel"><div className="eyebrow">{view}</div><h3>{view==='memories'?'Everything FollowUp knows on this device':view==='upcoming'?'Things Dad may need to act on':'Offers Dad received'}</h3><p className="sub">Sorted from the imported memory index.</p>{memories.filter(m=>view==='memories'||(view==='upcoming'?['deadline','payment','renewal','request'].includes(m.category):m.category==='offer')).sort((a,b)=>(a.date??'9999').localeCompare(b.date??'9999')).map(m=><div className="memory" key={m.id}><div className="memoryMeta"><span>{m.category.toUpperCase()} · {m.sender||m.sourceName}</span><span>{m.date||'undated'}</span></div><div className="memoryText">{m.text}</div></div>)}{!memories.filter(m=>view==='memories'||(view==='upcoming'?['deadline','payment','renewal','request'].includes(m.category):m.category==='offer')).length&&<div className="empty">Import a memory source or load the demo to populate this view.</div>}</div>}
      </div>
    </section>
    <footer className="footer"><span>FollowUp · private by default</span><span className="mono">OPEN-WEIGHT AI · LOCAL-FIRST</span></footer>
  </main>
}
