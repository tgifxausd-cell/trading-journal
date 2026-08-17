export type Trade={direction:string;segment:string;quantity:number;lot_size:number;entry_price:number;exit_price:number|null;stop_loss:number|null;target:number|null;brokerage_charges:number;net_pnl?:number;capital_deployed?:number;outcome?:string}
export function multiplier(t:Trade){return t.segment==='Spot/Cash'?1:(t.lot_size||1)}
export function capital(t:Trade){return (t.quantity||0)*(t.entry_price||0)*multiplier(t)}
export function gross(t:Trade){if(t.exit_price==null)return 0; const sign=t.direction==='Long'?1:-1; return (t.exit_price-t.entry_price)*t.quantity*multiplier(t)*sign}
export function net(t:Trade){return gross(t)-(t.brokerage_charges||0)}
export function pnlPct(t:Trade){const c=capital(t);return c?net(t)/c*100:0}
export function rMultiple(t:Trade){if(!t.stop_loss||t.exit_price==null)return null; const risk=Math.abs(t.entry_price-t.stop_loss)*t.quantity*multiplier(t); return risk?net(t)/risk:null}
export function outcome(t:Trade){if(t.exit_price==null)return 'Open'; const n=net(t); return n>0?'Win':n<0?'Loss':'Breakeven'}
