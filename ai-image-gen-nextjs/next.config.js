/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'dhydzauqxhxexrqqtewf.supabase.co', // <-- Add your Supabase hostname here
                port: '',
                pathname: '/storage/v1/object/public/**', // Allow images from any public path
            },
            // Add other hostnames here if needed, e.g.:
            // {
            //     protocol: 'https',
            //     hostname: 'replicate.delivery',
            //     port: '',
            //     pathname: '/**',
            // },
        ],
    },
    // ... any other existing configurations
};

module.exports = nextConfig;

// If using ESM (next.config.mjs):
// export default nextConfig; 