# TradeLog

Internal trade journaling tool for Indian and global markets.

## Included

- Supabase email/password authentication
- Dashboard with P&L, win rate, profit factor and equity curve
- Manual trade entry for spot, futures and options
- Full trade journal with search/filtering
- **Trade details/review page** for every trade
- **Edit Trade** flow for updating prices, thesis, post-trade review, emotion, rules and strategy tags
- Trade history/timestamps on the detail page
- Excel export
- Supabase RLS for per-user trade isolation

## Run locally

1. Create `.env.local` from `.env.example`.
2. Add your Supabase project URL and publishable key.
3. Run the SQL in `supabase/schema.sql` in Supabase SQL Editor.
4. Install dependencies:

```bash
npm install
```

5. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Trade review flow

From `/trades`, click **View** on any trade. The detail page shows:

- Instrument, market, segment and outcome
- Entry/exit dates and prices
- Quantity, lot size and capital
- Stop loss, target and charges
- Gross/net P&L, P&L %, R-multiple
- Strategy tags, emotion and rules followed
- Trade thesis
- Post-trade review/notes
- Trade timestamps/history
- **Edit Trade** button

After editing, **Save Changes** returns to the updated trade detail page.
