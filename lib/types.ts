export type MemoryKind = 'message' | 'document' | 'note' | 'screenshot' | 'voice';
export type MemoryCategory = 'deadline' | 'payment' | 'offer' | 'document' | 'request' | 'renewal' | 'general';

export interface Memory {
  id: string;
  text: string;
  sourceName: string;
  sender?: string;
  group?: string;
  date?: string;
  kind: MemoryKind;
  category: MemoryCategory;
  createdAt: number;
  embedding?: number[];
}

export interface SearchHit extends Memory { score: number; }
