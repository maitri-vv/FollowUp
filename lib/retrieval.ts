import { Memory, SearchHit } from './types';

export function lexicalSearch(memories: Memory[], query: string, limit=8): SearchHit[] {
  const terms = query.toLowerCase().replace(/[^\p{L}\p{N}₹]+/gu,' ').split(/\s+/).filter(x=>x.length>1);
  return memories.map(m=>{
    const text = `${m.text} ${m.sourceName} ${m.sender??''} ${m.group??''} ${m.category}`.toLowerCase();
    let score = 0;
    for (const term of terms) if (text.includes(term)) score += term.length > 4 ? 2 : 1;
    if (/due|deadline|when|date/.test(query.toLowerCase()) && ['deadline','payment','renewal'].includes(m.category)) score += 2;
    if (/offer|cheaper|discount|deal/.test(query.toLowerCase()) && m.category === 'offer') score += 3;
    return {...m,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,limit);
}

export function cosine(a:number[],b:number[]) { let dot=0,na=0,nb=0; const n=Math.min(a.length,b.length); for(let i=0;i<n;i++){dot+=a[i]*b[i];na+=a[i]*a[i];nb+=b[i]*b[i];} return dot/(Math.sqrt(na)*Math.sqrt(nb)||1); }
