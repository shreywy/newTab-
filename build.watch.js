const esbuild = require('esbuild');
const fs = require('fs');

if (!fs.existsSync('dist')) fs.mkdirSync('dist', { recursive: true });

const ignoreCss = {
  name: 'ignore-css',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'empty' }));
  },
};

esbuild.context({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  outfile: 'dist/bundle.js',
  platform: 'browser',
  target: ['chrome100'],
  define: { 'process.env.NODE_ENV': '"development"' },
  plugins: [ignoreCss],
}).then(ctx => {
  ctx.watch();
  console.log('Watching...');
}).catch(() => process.exit(1));
