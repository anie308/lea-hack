import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer, webpack }) => {
    // Ignore test files and other non-production files from node_modules
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    
    // Ignore test directories and files in thread-stream by making them resolve to false
    config.resolve.alias['thread-stream/test'] = false;
    config.resolve.alias['thread-stream/bench'] = false;
    
    // Ignore problematic imports by using NormalModuleReplacementPlugin
    config.plugins = config.plugins || [];
    const emptyModulePath = resolve(__dirname, 'lib/empty-module.js');
    
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /thread-stream\/test/,
        emptyModulePath
      ),
      new webpack.NormalModuleReplacementPlugin(
        /thread-stream\/bench/,
        emptyModulePath
      )
    );
    
    return config;
  },
  // Mark problematic packages as external for server components
  serverExternalPackages: ['pino', 'thread-stream'],
}

export default nextConfig
