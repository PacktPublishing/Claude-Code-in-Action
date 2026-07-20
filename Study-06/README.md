# Shopping List App

A shopping list application integrated with Supabase, built in Chapter 8.

## Features

- Add/delete shopping items
- Mark items as purchased
- Real-time sync with a Supabase database
- Share the same data across multiple devices

## Vercel Deployment Setup

To deploy to Vercel, you need to set the following environment variables:

### Required Environment Variables

1. Go to your project settings in the Vercel dashboard
2. Select Settings > Environment Variables
3. Add the following variables:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Getting Your Supabase Credentials

1. Log in to [Supabase](https://supabase.com)
2. Select your project
3. In Settings > API, find the following:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`

### Creating the Database Table

Run the following query in the Supabase SQL Editor:

```sql
CREATE TABLE shopping_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- Allow all users to read
CREATE POLICY "Enable read access for all users" ON shopping_items
  FOR SELECT USING (true);

-- Allow all users to insert
CREATE POLICY "Enable insert access for all users" ON shopping_items
  FOR INSERT WITH CHECK (true);

-- Allow all users to update
CREATE POLICY "Enable update access for all users" ON shopping_items
  FOR UPDATE USING (true);

-- Allow all users to delete
CREATE POLICY "Enable delete access for all users" ON shopping_items
  FOR DELETE USING (true);
```

## Local Development

To test locally:

1. Create a `.env.local` file:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Run with the Vercel CLI:
```bash
vercel dev
```

## Tech Stack

- HTML/CSS/JavaScript
- Supabase (PostgreSQL database)
- Vercel (serverless functions and hosting)
