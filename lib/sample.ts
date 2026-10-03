import { Memory } from './types';

export const sampleMemories: Memory[] = [
  {id:'s1',text:'Society Admin: Maintenance for October is ₹4,800. Please pay by 7 October 2026. Clearance requests after the due date may take longer.',sourceName:'Society Residents',sender:'Society Admin',group:'Green View Society',date:'2026-10-01',kind:'message',category:'payment',createdAt:Date.now()-86400000},
  {id:'s2',text:'Rajesh: I can get you the Voltas AC service package at the festival offer price. Call me before 12 October.',sourceName:'Friends',sender:'Rajesh',group:'Friends',date:'2026-09-28',kind:'message',category:'offer',createdAt:Date.now()-345600000},
  {id:'s3',text:'Anita: Please send the electricity bill PDF for Flat 804 before Friday. I need it for the society records.',sourceName:'Society Residents',sender:'Anita',group:'Green View Society',date:'2026-10-01',kind:'message',category:'request',createdAt:Date.now()-86400000},
  {id:'s4',text:'LIC reminder: policy premium renewal is due on 18 October 2026. Policy document is saved in the insurance folder.',sourceName:'Notes',date:'2026-09-25',kind:'note',category:'renewal',createdAt:Date.now()-604800000},
  {id:'s5',text:'Mahesh: I sent you the quotation as a PDF yesterday. Check our WhatsApp chat if you need the amount.',sourceName:'Friends',sender:'Mahesh',group:'Friends',date:'2026-09-30',kind:'message',category:'document',createdAt:Date.now()-172800000},
  {id:'s6',text:'AC service contact: Rajesh from the building group recommended a technician. Offer includes free gas top-up if booked this week.',sourceName:'Saved note',date:'2026-09-29',kind:'note',category:'offer',createdAt:Date.now()-259200000},
  {id:'s7',text:'Bank statement PDF was sent to Maitri on 26 September. If asked where it was sent, it was in the family WhatsApp chat.',sourceName:'Family',group:'Family',date:'2026-09-26',kind:'message',category:'document',createdAt:Date.now()-518400000},
  {id:'s8',text:'Society office: clearance form is available after dues are cleared. Keep the payment receipt for the application.',sourceName:'Green View Society',sender:'Society Office',date:'2026-09-22',kind:'message',category:'document',createdAt:Date.now()-864000000}
];
