'use client'

import {useEffect,useState} from 'react';
import {useParams,useRouter} from 'next/navigation';
import {ArrowLeft} from 'lucide-react';
import {supabaseBrowser} from '@/lib/supabase';
import TradeForm from '@/components/TradeForm';

export default function EditTrade(){
  const params=useParams();
  const router=useRouter();
  const sb=supabaseBrowser();
  const id=String(params.id);
  const [trade,setTrade]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  useEffect(()=>{
    async function load(){
      const {data:{user}}=await sb.auth.getUser();
      if(!user){router.replace('/');return}
      const {data,error}=await sb.from('trades').select('*').eq('id',id).eq('user_id',user.id).single();
      if(error)setError(error.message); else setTrade(data);
      setLoading(false);
    }
    load();
  },[id]);

  if(loading)return <div className="min-h-screen grid place-items-center muted">Loading trade…</div>;
  if(error||!trade)return <main className="min-h-screen grid place-items-center p-6"><div className="card p-6 max-w-md w-full"><p className="text-red-400 mb-4">{error||'Trade not found.'}</p><button className="btn btn-secondary" onClick={()=>router.push('/trades')}>Back to Journal</button></div></main>;

  return <main className="min-h-screen pb-10">
    <header className="border-b border-[#262B35]"><div className="max-w-5xl mx-auto px-5 h-16 flex items-center gap-3"><button className="btn btn-secondary flex gap-2 items-center" onClick={()=>router.push(`/trade/${trade.id}`)}><ArrowLeft size={16}/> Trade Details</button><div><h1 className="font-bold">Edit Trade</h1><p className="muted text-xs">{trade.instrument} · Update your notes, review, prices or discipline record</p></div></div></header>
    <div className="max-w-5xl mx-auto p-5"><TradeForm initialTrade={trade} mode="edit"/></div>
  </main>
}
