-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    content TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    username TEXT NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Allow users to view all profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

-- Allow users to update only their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Set up Row Level Security for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
-- Allow users to view all messages
CREATE POLICY "Messages are viewable by everyone" ON public.messages
    FOR SELECT USING (true);

-- Allow users to insert their own messages
CREATE POLICY "Users can insert their own messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create realtime publication for messages
BEGIN;
  -- Drop publication if it exists
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Create new publication for all changes
  CREATE PUBLICATION supabase_realtime;
COMMIT;

-- Add messages table to publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; 