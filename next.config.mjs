/** @type {import('next').NextConfig} */
const nextConfig = {
    assetPrefix: process.env.NODE_ENV === 'production' ? 'https://sw-hie-ie.nknu.edu.tw' : '',
    basePath: process.env.NODE_ENV === 'production' ? '/myblock3c' : '',
};

export default nextConfig;
