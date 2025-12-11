/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    basePath: process.env.NODE_ENV === 'development' ? '' : '/myblock3',
    assetPrefix: process.env.NODE_ENV === 'development' ? '' : '/myblock3/',
    trailingSlash: true,
    images: {
        unoptimized: true
    }
}

export default nextConfig