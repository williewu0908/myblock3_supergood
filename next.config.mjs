/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    basePath: '/myblock3c', 
    assetPrefix: '/myblock3c/',
    trailingSlash: true,
    images: {
    unoptimized: true
}
}

export default nextConfig