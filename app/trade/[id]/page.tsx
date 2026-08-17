'use client'

import {useEffect,useMemo,useState} from 'react';
import {useParams,useRouter} from 'next/navigation';
import {supabaseBrowser} from '@/lib/supabase';
import {ArrowLeft,CalendarDays,Clock3,Edit3,FileText,History,ShieldCheck,Target,TrendingDown,TrendingUp} from 'lucide-react';

const money=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n||0));
const number=(n:any)=>Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});

export default function TradeDetail(){
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

  const pnlTone=useMemo(()=>Number(trade?.net_pnl||0)>0?'positive':Number(trade?.net_pnl||0)<0?'negative':'muted',[trade]);
  if(loading)return <div className="min-h-screen grid place-items-center muted">Loading trade…</div>;
  if(error||!trade)return <main className="min-h-screen grid place-items-center p-6"><div className="card p-6 max-w-md w-full"><p className="text-red-400 mb-4">{error||'Trade not found.'}</p><button className="btn btn-secondary" onClick={()=>router.push('/trades')}>Back to Journal</button></div></main>;

  const isFno=trade.segment!=='Spot/Cash';
  const isClosed=trade.outcome!=='Open';

  return <main className="min-h-screen pb-10">
    <header className="border-b border-[#262B35] sticky top-0 z-20 bg-[#0F1115]/95 backdrop-blur">
      <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between gap-3">
        <button className="btn btn-secondary flex gap-2 items-center" onClick={()=>router.push('/trades')}><ArrowLeft size={16}/> Journal</button>
        <button className="btn btn-primary flex gap-2 items-center" onClick={()=>router.push(`/trade/${trade.id}/edit`)}><Edit3 size={16}/> Edit Trade</button>
      </div>
    </header>

    <div className="max-w-5xl mx-auto p-5 space-y-5">
      <section className="card p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2"><span className="text-xs px-2.5 py-1 rounded-full border border-[#303744] muted">{trade.market}</span><span className="text-xs px-2.5 py-1 rounded-full border border-[#303744] muted">{trade.segment}</span><span className={`text-xs px-2.5 py-1 rounded-full border ${trade.outcome==='Win'?'border-[#22C55E]/40 text-[#22C55E]':trade.outcome==='Loss'?'border-[#EF4444]/40 text-[#EF4444]':trade.outcome==='Open'?'border-[#F59E0B]/40 text-[#F59E0B]':'border-[#303744] muted'}`}>{trade.outcome}</span></div>
            <h1 className="text-3xl font-black tracking-tight">{trade.instrument}</h1>
            <p className="muted mt-1">{trade.direction} · {trade.segment}{isFno&&trade.option_type?` · ${trade.option_type}`:''}{isFno&&trade.strike_price!=null?` · Strike ${number(trade.strike_price)}`:''}</p>
          </div>
          <div className="text-left md:text-right"><div className="muted text-xs">Net P&L</div><div className={`text-3xl font-black tabnums ${pnlTone}`}>{isClosed?money(trade.net_pnl):'Open'}</div>{trade.r_multiple!=null&&<div className="muted text-sm mt-1">{number(trade.r_multiple)}R</div>}</div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric icon={<CalendarDays size={16}/>} label="Entry" value={new Date(trade.entry_at).toLocaleString('en-IN')}/>
        <Metric icon={<Clock3 size={16}/>} label="Exit" value={trade.exit_at?new Date(trade.exit_at).toLocaleString('en-IN'):'Still open'}/>
        <Metric icon={<Target size={16}/>} label="Entry → Exit" value={`${number(trade.entry_price)}${trade.exit_price!=null?` → ${number(trade.exit_price)}`:' → —'}`}/>
        <Metric icon={Number(trade.net_pnl)>=0?<TrendingUp size={16}/>:<TrendingDown size={16}/>} label="P&L %" value={isClosed?`${number(trade.pnl_pct)}%`:'—'} tone={pnlTone}/>
      </section>

      <section className="card p-5">
        <div className="flex items-center gap-2 mb-4"><FileText size={17} className="text-[#22D3B8]"/><h2 className="font-semibold">Trade details</h2></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
          <Detail label="Market" value={trade.market}/><Detail label="Segment" value={trade.segment}/><Detail label="Direction" value={trade.direction}/><Detail label="Quantity" value={number(trade.quantity)}/><Detail label="Lot size" value={number(trade.lot_size)}/><Detail label="Capital deployed" value={money(trade.capital_deployed)}/><Detail label="Entry price" value={number(trade.entry_price)}/><Detail label="Exit price" value={trade.exit_price!=null?number(trade.exit_price):'—'}/><Detail label="Stop loss" value={trade.stop_loss!=null?number(trade.stop_loss):'—'}/><Detail label="Target" value={trade.target!=null?number(trade.target):'—'}/><Detail label="Brokerage & charges" value={money(trade.brokerage_charges)}/><Detail label="Gross P&L" value={isClosed?money(trade.gross_pnl):'—'}/><Detail label="Net P&L" value={isClosed?money(trade.net_pnl):'—'}/><Detail label="R-Multiple" value={trade.r_multiple!=null?`${number(trade.r_multiple)}R`:'—'}/>{isFno&&<Detail label="Expiry" value={trade.expiry_date?new Date(trade.expiry_date).toLocaleDateString('en-IN'):'—'}/>} {trade.option_type&&<Detail label="Option type" value={trade.option_type}/>} {trade.strike_price!=null&&<Detail label="Strike price" value={number(trade.strike_price)}/>} 
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-5">
        <ReviewCard title="Trade thesis" icon={<Target size={17}/>} text={trade.trade_thesis} empty="No thesis was recorded for this trade."/>
        <ReviewCard title="Post-trade review" icon={<History size={17}/>} text={trade.post_trade_review} empty="No post-trade review has been written yet. Edit this trade to add your review."/>
      </section>

      <section className="card p-5">
        <div className="flex items-center gap-2 mb-4"><ShieldCheck size={17} className="text-[#22D3B8]"/><h2 className="font-semibold">Discipline & context</h2></div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Detail label="Rules followed" value={trade.rules_followed||'—'}/>
          <Detail label="Emotion / state" value={trade.emotion||'—'}/>
          <Detail label="Strategy" value={trade.strategy_tags?.length?trade.strategy_tags.join(' · '):'No tags'}/>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center gap-2 mb-4"><History size={17} className="text-[#22D3B8]"/><h2 className="font-semibold">Trade history</h2></div>
        <div className="space-y-4">
          <TimelineItem title="Trade created" value={new Date(trade.created_at).toLocaleString('en-IN')} />
          <TimelineItem title={trade.outcome==='Open'?'Currently open':'Exit recorded'} value={trade.exit_at?new Date(trade.exit_at).toLocaleString('en-IN'):'No exit recorded yet'} />
          <TimelineItem title="Last saved" value={new Date(trade.updated_at||trade.created_at).toLocaleString('en-IN')} />
        </div>
        <p className="muted text-xs mt-5">This history shows the timestamps stored for the trade. It does not currently keep field-by-field versions of previous edits.</p>
      </section>

      <div className="flex justify-end"><button className="btn btn-primary flex gap-2 items-center" onClick={()=>router.push(`/trade/${trade.id}/edit`)}><Edit3 size={16}/> Review & Edit Trade</button></div>
    </div>
  </main>
}

function Metric({icon,label,value,tone}:{icon:React.ReactNode;label:string;value:string;tone?:string}){return <div className="card p-4"><div className="flex items-center gap-2 muted text-xs">{icon}{label}</div><div className={`font-bold mt-2 text-sm ${tone||''}`}>{value}</div></div>}
function Detail({label,value}:{label:string;value:string}){return <div><div className="muted text-xs mb-1">{label}</div><div className="font-semibold break-words">{value}</div></div>}
function ReviewCard({title,icon,text,empty}:{title:string;icon:React.ReactNode;text:string;empty:string}){return <section className="card p-5"><div className="flex items-center gap-2 mb-3">{icon}<h2 className="font-semibold">{title}</h2></div><div className="whitespace-pre-wrap text-sm leading-6 text-[#D9DEE7]">{text?.trim()||<span className="muted">{empty}</span>}</div></section>}
function TimelineItem({title,value}:{title:string;value:string}){return <div className="flex gap-3"><div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#22D3B8] shrink-0"/><div><div className="font-medium text-sm">{title}</div><div className="muted text-xs mt-1">{value}</div></div></div>}
