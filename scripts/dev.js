const { build } = require("esbuild")
const minimist = require("minimist")
const { resolve } = require("path")

const args = minimist(process.argv.slice(2))

const packageName = args._[0] || 'reactivity'

const format = args.f || 'global'

// 查找开发环境下指定的package
const pkg = require(resolve(__dirname, `../packages/${packageName}/package.json`))

// 指定打包格式
// 如果是global，则是iife 立即执行函数
// 否则如果是cjs的话，打包成commonjs
// 否则就打包成 esmodule 模式
const outputFormat = format === 'global' ? 'iife' : format === 'cjs' ? 'cjs' : 'esm'

// 指定打包目录
const outfile = resolve(__dirname, `../packages/${packageName}/dist/${packageName}.${format}.js`)

build({
  entryPoints: [resolve(__dirname, `../packages/${packageName}/src/index.ts`)],
  outfile,
  bundle: true,
  sourcemap: true,
  format: outputFormat,
  globalName: pkg.buildOptions?.name,
  platform: format === 'cjs' ? 'node' : 'browser',
  watch: {
    onRebuild(error) {
      if (!error) {
        console.log('rebuild ~~~')
      }
    }
  }
}).then(() => {
  console.log('watching')
})