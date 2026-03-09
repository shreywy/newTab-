const esbuild = require('esbuild');
const fs = require('fs');

if (!fs.existsSync('dist')) fs.mkdirSync('dist', { recursive: true });

const ignoreCss = {
  name: 'ignore-css',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'empty' }));
  },
};

esbuild.build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  outfile: 'dist/bundle.js',
  platform: 'browser',
  target: ['chrome100'],
  minify: true,
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [ignoreCss],
}).then(() => {
  // Clean up stale bundle.css if esbuild emits one
  try { fs.unlinkSync('dist/bundle.css'); } catch {}
  console.log('Build complete!');
}).catch(() => process.exit(1));
