/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  async rewrites() {
    // The production manifest (memories.json in Blob) references these three
    // seed photos by their original .png paths. The 15MB PNGs were replaced
    // with 2400px JPEGs in Stage 6; these rewrites keep every stored URL
    // working without a data migration.
    return ['MainPic', 'BrunchSnob', 'SFNight'].map((name) => ({
      source: `/${name}.png`,
      destination: `/${name}.jpg`,
    }))
  },
}

module.exports = nextConfig
