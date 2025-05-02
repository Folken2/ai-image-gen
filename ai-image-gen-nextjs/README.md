# AI Image Generation Web App (Next.js)

This project is a web application built with [Next.js](https://nextjs.org) that allows users to generate images using various AI models through different providers like OpenAI and Together AI. It features a user-friendly interface to specify prompts, styles, dimensions, and advanced generation parameters, storing generation results in a Supabase database.

## Features

*   Generate images from text prompts.
*   Supports multiple AI providers:
    *   OpenAI (`gpt-image-1`)
    *   Together AI (Currently configured for `FLUX.1-schnell-Free`)
    *   (Stubbed for direct Flux API - Not implemented)
*   Selectable image styles (Cinematic, Photographic, Anime, etc.).
*   Configurable dimensions, image count.
*   Advanced options: Negative prompt, Seed, Steps, Guidance Scale.
*   Uses Supabase for storing image generation metadata.
*   Built with Next.js App Router, TypeScript, Tailwind CSS, and Shadcn/UI.
*   Includes Vercel Analytics for visitor tracking and performance monitoring.

## Future Features

- Add quality selection for OpenAI API ('low', 'medium', 'high', 'auto')
- Add ability to delete saved prompts
- Add more style filters
- Add image editing features

## Getting Started

### Prerequisites

*   Node.js (Version 20 or later recommended)
*   npm, yarn, pnpm, or bun
*   Access keys for desired AI providers (OpenAI, Together AI).
*   A Supabase project for database storage.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd ai-image-gen-nextjs
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    # or
    # bun install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the `ai-image-gen-nextjs` directory by copying the example file if one exists, or create it from scratch. Add the following variables:

    ```env
    # Supabase Configuration (Required)
    NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

    # AI Provider API Keys (Required for corresponding provider)
    OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
    TOGETHER_API_KEY="YOUR_TOGETHER_AI_KEY"
    # Add other keys if new providers are implemented
    ```
    *   Replace `"YOUR_..."` with your actual Supabase credentials and API keys.
    *   The `together-ai` library reads `TOGETHER_API_KEY` automatically.
    *   The `openai` library reads `OPENAI_API_KEY` automatically.

4.  **Set up Supabase Database:**
    *   Ensure you have a Supabase project created.
    *   You need an `images` table in your public schema. You can use the following SQL statement in the Supabase SQL Editor:
      ```sql
      CREATE TABLE public.images (
          id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
          prompt_text text NOT NULL,
          negative_prompt text NULL,
          image_url text NOT NULL, -- Consider Supabase Storage for large images later
          provider text NULL,
          model text NULL,
          width integer NULL,
          height integer NULL,
          seed bigint NULL,
          steps integer NULL,
          guidance_scale real NULL,
          status text NULL, -- e.g., 'pending', 'completed', 'failed'
          prompt_id bigint NULL -- Optional: Foreign key to a 'prompts' table
          -- Add user_id uuid NULL REFERENCES auth.users(id) if tracking user generations
      );

      -- Optional: Enable Row Level Security (Recommended)
      ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

      -- Example Policies (Adjust based on your auth needs):
      -- Allow public read access:
      -- CREATE POLICY "Allow public read access" ON public.images FOR SELECT USING (true);

      -- Allow authenticated users to insert their own images:
      -- CREATE POLICY "Allow insert for authenticated users" ON public.images FOR INSERT WITH CHECK (auth.role() = 'authenticated');

      -- Allow users to view their own images:
      -- CREATE POLICY "Allow users to view their own images" ON public.images FOR SELECT USING (auth.uid() = user_id); -- Requires adding user_id column
      ```
    *   Review and adjust the table schema and Row Level Security (RLS) policies according to your needs.

### Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application. The app will automatically redirect you to the `/generate` page.

## Usage

1.  Navigate to the application (defaults to `/generate`).
2.  Select the desired **AI Provider** from the dropdown (e.g., OpenAI, Together AI).
3.  Enter your **Prompt** in the text area.
4.  Choose the desired **Dimensions** and **Image count**.
5.  Select a **Style** (e.g., Cinematic, Anime).
6.  (Optional) Expand the **Advanced Options** accordion:
    *   Add a **Negative Prompt**.
    *   Set a specific **Seed** (numeric) for reproducibility, or leave blank for random.
    *   Adjust **Steps** and **Guidance Scale** using the sliders (defaults are set based on the provider/model).
7.  Click the **Generate** button.
8.  The application will show a loading state while contacting the API.
9.  Generated images will appear in the right-hand panel upon completion.
10. View generation metadata logged in the browser console and stored in your Supabase `images` table.
11. Use the **Clear** button to reset all fields to their default values.

## Learn More

To learn more about the technologies used, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
-   [Supabase Documentation](https://supabase.com/docs) - learn about Supabase features.
-   [Together AI Documentation](https://docs.together.ai/)
-   [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
-   [Shadcn/UI](https://ui.shadcn.com/) - Component library used.

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Ensure you configure your environment variables (Supabase keys, AI API keys) in your Vercel project settings.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
