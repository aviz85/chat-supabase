# Simple Supabase Chat App

A simple chat application with authentication built using HTML, CSS, and JavaScript with Supabase as the backend.

## Features

- User authentication (login/signup)
- Real-time chat messaging
- Message history

## Project Structure

- `index.html` - Main HTML file with the UI structure
- `styles.css` - CSS styles for the application
- `app.js` - JavaScript with authentication and chat functionality
- `supabase/migrations/` - Migration files for Supabase setup

## Setup Instructions

### 1. Local Development

Simply open `index.html` in your browser to use the application locally.

### 2. Supabase Setup

To set up the required tables in Supabase:

1. Install Supabase CLI: 
   ```
   npm install -g supabase
   ```

2. Login to Supabase CLI:
   ```
   supabase login
   ```

3. Link your Supabase project:
   ```
   supabase link --project-ref paoemykauclmgkwhzcju
   ```

4. Apply migrations:
   ```
   supabase db push
   ```

### 3. Alternative Manual Setup

If you prefer to set up tables manually:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/migrations/20240430000000_initial_schema.sql`
4. Run the SQL queries in the Supabase SQL Editor

## Configuration

The application is already configured with the Supabase URL and anonymous key. If you need to use a different project, update the following constants in `app.js`:

```javascript
const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

## Usage

1. Open the application in a browser
2. Sign up for a new account or log in with existing credentials
3. Start chatting!

## Security Note

The anonymous key included in this code is safe to use in client-side code as it only has permissions defined by Row Level Security (RLS) policies. 