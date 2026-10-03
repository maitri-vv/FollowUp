'use client';

import { cosine } from './retrieval';
import { Memory, SearchHit } from './types';

let embedder: any = null;
let generator: any = null;
let loadingEmbed = false;
let loadingGen = false;

export const MODEL = 'onnx-community/gemma-3-270m-it-ONNX';
export const EMBED_MODEL = 'Xenova/all-MiniLM-L6-v2';

export async function loadEmbedder(onProgress?: (x:string)=>void) {
  if (embedder) return embedder;
  if (loadingEmbed) { while(!embedder) await new Promise(r=>setTimeout(r,100)); return embedder; }
  loadingEmbed = true;
  try {
    const { pipeline } = await import('@huggingface/transformers');
    embedder = await pipeline('feature-extraction', EMBED_MODEL, { device: 'webgpu', dtype: 'fp32', progress_callback: (p:any)=>onProgress?.(p?.status ? `${p.status}${p.file ? ` · ${p.file}`:''}` : 'Loading embeddings…') });
    return embedder;
  } catch (e) {
    // Retry on CPU for browsers without WebGPU.
    const { pipeline } = await import('@huggingface/transformers');
    embedder = await pipeline('feature-extraction', EMBED_MODEL, { dtype: 'q8', progress_callback: (p:any)=>onProgress?.(p?.status ? `${p.status}` : 'Loading embeddings…') });
    return embedder;
  } finally { loadingEmbed = false; }
}

export async function embedText(text: string, onProgress?: (x:string)=>void): Promise<number[]> {
  const pipe = await loadEmbedder(onProgress);
  const out = await pipe(text, { pooling:'mean', normalize:true });
  return Array.from(out.data as Float32Array);
}

export async function loadGenerator(onProgress?: (x:string)=>void) {
  if (generator) return generator;
  if (loadingGen) { while(!generator) await new Promise(r=>setTimeout(r,100)); return generator; }
  loadingGen = true;
  try {
    const { pipeline } = await import('@huggingface/transformers');
    generator = await pipeline('text-generation', MODEL, { device:'webgpu', dtype:'q4f16', progress_callback:(p:any)=>onProgress?.(p?.status ? `${p.status}${p.file ? ` · ${p.file}`:''}` : 'Loading Gemma…') });
    return generator;
  } catch (e) {
    const { pipeline } = await import('@huggingface/transformers');
    generator = await pipeline('text-generation', MODEL, { dtype:'q4', progress_callback:(p:any)=>onProgress?.(p?.status ? `${p.status}` : 'Loading Gemma…') });
    return generator;
  } finally { loadingGen = false; }
}

export async function semanticSearch(memories:Memory[], query:string, onProgress?: (x:string)=>void, limit=8):Promise<SearchHit[]> {
  const q = await embedText(query,onProgress);
  const hits:SearchHit[] = [];
  for (const m of memories) {
    if (!m.embedding) continue;
    hits.push({...m,score:cosine(q,m.embedding)});
  }
  return hits.sort((a,b)=>b.score-a.score).slice(0,limit);
}

export async function answerWithGemma(query:string, hits:SearchHit[], onProgress?: (x:string)=>void) {
  const pipe = await loadGenerator(onProgress);
  const context = hits.map((h,i)=>`[SOURCE ${i+1}]\nsource: ${h.sourceName}\nsender: ${h.sender??'unknown'}\ngroup: ${h.group??'unknown'}\ndate: ${h.date??'unknown'}\ncategory: ${h.category}\ncontent: ${h.text}`).join('\n\n');
  const messages = [
    {role:'system',content:'You are FollowUp, a private family memory assistant. Answer ONLY from the supplied memory sources. Never invent dates, amounts, names, or events. If the evidence is insufficient, say that clearly. Keep answers concise and useful. Mention the source sender/group/date when available. If several sources conflict, say so.'},
    {role:'user',content:`MEMORIES:\n${context || '(no matching memories)'}\n\nQUESTION: ${query}`}
  ];
  const output = await pipe(messages,{max_new_tokens:220,do_sample:false});
  const generated = output?.[0]?.generated_text;
  if (Array.isArray(generated)) return generated.at(-1)?.content ?? 'I could not generate an answer.';
  return typeof generated === 'string' ? generated : 'I could not generate an answer.';
}

export function isGeneratorLoaded(){return !!generator;}
