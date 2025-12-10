/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    basePath: process.env.NODE_ENV === 'development' ? '' : '/myblock3c',
    assetPrefix: process.env.NODE_ENV === 'development' ? '' : '/myblock3c/',
    trailingSlash: true,
    images: {
        unoptimized: true
    }
}

export default nextConfig