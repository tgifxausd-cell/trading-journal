'use client'

import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {supabaseBrowser} from '@/lib/supabase';
import {capital,gross,net,pnlPct,rMultiple,outcome} from '@/lib/calculations';

const markets=['Indian Equity','Indian F&O','US Equity','US Options','Forex','Crypto','Commodity'];
const strategies=['Breakout','Mean Reversion','Earnings Play','ICT/SMC','Swing','Scalp'];

type TradeFormProps={
  initialTrade?:any;
  mode?:'create'|'edit';
};

const blankTrade=()=>({
  entry_at:new Date().toISOString().slice(0,16),market:'Indian Equity',instrument:'',segment:'Spot/Cash',option_type:'',strike_price:'',expiry_date:'',direction:'Long',quantity:1,lot_size:1,entry_price:'',exit_at:'',exit_price:'',stop_loss:'',target:'',brokerage_charges:0,strategy_tags:[],trade_thesis:'',emotion:'Neutral',post_trade_review:'',rules_followed:'Yes'
});

function toLocalDateTime(value:string|null|undefined){
  if(!value)return '';
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))return '';
  const pad=(n:number)=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function normalizeTrade(t:any){
  return {
    ...blankTrade(),
    ...t,
    entry_at:toLocalDateTime(t.entry_at) || new Date().toISOString().slice(0,16),
    exit_at:toLocalDateTime(t.exit_at),
    strike_price:t.strike_price ?? '',
    expiry_date:t.expiry_date ?? '',
    exit_price:t.exit_price ?? '',
    stop_loss:t.stop_loss ?? '',
    target:t.target ?? '',
    brokerage_charges:t.brokerage_charges ?? 0,
    strategy_tags:Array.isArray(t.strategy_tags)?t.strategy_tags:[],
    trade_thesis:t.trade_thesis ?? '',
    emotion:t.emotion ?? 'Neutral',
    post_trade_review:t.post_trade_review ?? '',
    rules_followed:t.rules_followed ?? 'Partial',
  };
}

export default function TradeForm({initialTrade,mode='create'}:TradeFormProps){
  const router=useRouter();
  const sb=supabaseBrowser();
  const [saving,setSaving]=useState(false);
  const [msg,setMsg]=useState('');
  const [f,setF]=useState<any>(()=>initialTrade?normalizeTrade(initialTrade):blankTrade());

  useEffect(()=>{if(initialTrade)setF(normalizeTrade(initialTrade))},[initialTrade]);

  const set=(k:string,v:any)=>setF((x:any)=>({...x,[k]:v}));
  const calc={...f,quantity:Number(f.quantity||0),lot_size:Number(f.lot_size||1),entry_price:Number(f.entry_price||0),exit_price:f.exit_price===''?null:Number(f.exit_price),stop_loss:f.stop_loss===''?null:Number(f.stop_loss),target:f.target===''?null:Number(f.target),brokerage_charges:Number(f.brokerage_charges||0)};
  const isFno=f.segment!=='Spot/Cash';

  async function save(e:React.FormEvent){
    e.preventDefault();
    setSaving(true);setMsg('');
    const {data:{user}}=await sb.auth.getUser();
    if(!user){router.replace('/');return}
    const c=capital(calc),g=gross(calc),n=net(calc);
    const payload:any={
      user_id:user.id,
      entry_at:new Date(f.entry_at).toISOString(),
      exit_at:f.exit_at?new Date(f.exit_at).toISOString():null,
      market:f.market,
      instrument:f.instrument,
      segment:f.segment,
      direction:f.direction,
      capital_deployed:c,
      gross_pnl:g,
      net_pnl:n,
      pnl_pct:pnlPct(calc),
      r_multiple:rMultiple(calc),
      outcome:outcome(calc),
      option_type:isFno?f.option_type:null,
      strike_price:isFno&&f.strike_price!==''?Number(f.strike_price):null,
      expiry_date:isFno&&f.expiry_date?f.expiry_date:null,
      quantity:Number(f.quantity),
      lot_size:Number(f.lot_size),
      entry_price:Number(f.entry_price),
      exit_price:f.exit_price===''?null:Number(f.exit_price),
      stop_loss:f.stop_loss===''?null:Number(f.stop_loss),
      target:f.target===''?null:Number(f.target),
      brokerage_charges:Number(f.brokerage_charges||0),
      strategy_tags:f.strategy_tags,
      trade_thesis:f.trade_thesis,
      emotion:f.emotion,
      post_trade_review:f.post_trade_review,
      rules_followed:f.rules_followed,
    };

    const result=mode==='edit'&&initialTrade?.id
      ? await sb.from('trades').update(payload).eq('id',initialTrade.id).eq('user_id',user.id).select().single()
      : await sb.from('trades').insert(payload).select().single();

    if(result.error)setMsg(result.error.message);
    else router.push(`/trade/${initialTrade?.id||result.data.id}`);
    setSaving(false);
  }

  return <form onSubmit={save} className="space-y-5">
    <div className="grid md:grid-cols-3 gap-4">
      <Field label="Entry date & time"><input className="input" type="datetime-local" required value={f.entry_at} onChange={e=>set('entry_at',e.target.value)}/></Field>
      <Field label="Market"><select className="input" value={f.market} onChange={e=>set('market',e.target.value)}>{markets.map(x=><option key={x}>{x}</option>)}</select></Field>
      <Field label="Instrument / Symbol"><input className="input" required placeholder="NIFTY, RELIANCE, AAPL, BTCUSD" value={f.instrument} onChange={e=>set('instrument',e.target.value.toUpperCase())}/></Field>
      <Field label="Segment"><select className="input" value={f.segment} onChange={e=>set('segment',e.target.value)}><option>Spot/Cash</option><option>Futures</option><option>Options</option></select></Field>
      {f.segment==='Options'&&<><Field label="Option type"><select className="input" value={f.option_type} onChange={e=>set('option_type',e.target.value)}><option value="">Select</option><option>Call</option><option>Put</option></select></Field><Field label="Strike price"><input className="input" type="number" value={f.strike_price} onChange={e=>set('strike_price',e.target.value)}/></Field></>}
      {isFno&&<Field label="Expiry date"><input className="input" type="date" value={f.expiry_date} onChange={e=>set('expiry_date',e.target.value)}/></Field>}
      <Field label="Direction"><select className="input" value={f.direction} onChange={e=>set('direction',e.target.value)}><option>Long</option><option>Short</option></select></Field>
      <Field label="Quantity"><input className="input" type="number" min="1" value={f.quantity} onChange={e=>set('quantity',e.target.value)}/></Field>
      {isFno&&<Field label="Lot size"><input className="input" type="number" min="1" value={f.lot_size} onChange={e=>set('lot_size',e.target.value)}/></Field>}
      <Field label="Entry price"><input className="input" type="number" step="any" required value={f.entry_price} onChange={e=>set('entry_price',e.target.value)}/></Field>
      <Field label="Exit date & time (optional)"><input className="input" type="datetime-local" value={f.exit_at||''} onChange={e=>set('exit_at',e.target.value)}/></Field>
      <Field label="Exit price (optional)"><input className="input" type="number" step="any" value={f.exit_price} onChange={e=>set('exit_price',e.target.value)}/></Field>
      <Field label="Stop loss"><input className="input" type="number" step="any" value={f.stop_loss} onChange={e=>set('stop_loss',e.target.value)}/></Field>
      <Field label="Target"><input className="input" type="number" step="any" value={f.target} onChange={e=>set('target',e.target.value)}/></Field>
      <Field label="Brokerage & charges"><input className="input" type="number" step="any" value={f.brokerage_charges} onChange={e=>set('brokerage_charges',e.target.value)}/></Field>
    </div>
    <div className="card p-4 grid grid-cols-2 md:grid-cols-4 gap-4"><Stat label="Capital" value={capital(calc).toFixed(2)}/><Stat label="Gross P&L" value={f.exit_price===''?'—':gross(calc).toFixed(2)}/><Stat label="Net P&L" value={f.exit_price===''?'—':net(calc).toFixed(2)}/><Stat label="R-Multiple" value={rMultiple(calc)==null?'—':rMultiple(calc)!.toFixed(2)+'R'}/></div>
    <div className="grid md:grid-cols-2 gap-4">
      <Field label="Strategy tags"><div className="flex flex-wrap gap-2">{strategies.map(s=><button type="button" key={s} onClick={()=>set('strategy_tags',f.strategy_tags.includes(s)?f.strategy_tags.filter((x:string)=>x!==s):[...f.strategy_tags,s])} className={`px-3 py-1.5 rounded-full text-xs border ${f.strategy_tags.includes(s)?'border-[#22D3B8] bg-[#22d3b81a] text-[#22D3B8]':'border-[#303744] text-gray-300'}`}>{s}</button>)}</div></Field>
      <Field label="Emotion / state"><select className="input" value={f.emotion} onChange={e=>set('emotion',e.target.value)}><option>Confident</option><option>FOMO</option><option>Revenge</option><option>Neutral</option><option>Anxious</option></select></Field>
      <Field label="Rules followed"><select className="input" value={f.rules_followed} onChange={e=>set('rules_followed',e.target.value)}><option>Yes</option><option>No</option><option>Partial</option></select></Field>
      <Field label="Trade thesis"><textarea className="input min-h-28" placeholder="Why did you take this trade?" value={f.trade_thesis} onChange={e=>set('trade_thesis',e.target.value)}/></Field>
      <Field label="Post-trade review"><textarea className="input min-h-28" placeholder="What went right, wrong, and what did you learn?" value={f.post_trade_review} onChange={e=>set('post_trade_review',e.target.value)}/></Field>
    </div>
    {msg&&<div className="text-sm text-red-400">{msg}</div>}
    <div className="flex gap-2 justify-end"><button type="button" className="btn btn-secondary" onClick={()=>router.back()}>Cancel</button><button disabled={saving} className="btn btn-primary">{saving?(mode==='edit'?'Saving changes…':'Saving…'):(mode==='edit'?'Save Changes':'Save Trade')}</button></div>
  </form>
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <div><label className="label">{label}</label>{children}</div>}
function Stat({label,value}:{label:string;value:string}){return <div><div className="muted text-xs">{label}</div><div className="font-bold tabnums mt-1">{value}</div></div>}
