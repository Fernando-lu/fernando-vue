#### 手写vue3代码

文件目录结构对照vue3的进行调整

运行环境 node > 14。

建议安装`nvm`可以进行`node`版本的管理

需要提前在全局安装pnpm包管理工具，查看 https://www.pnpm.cn/cli/add

```
npm install pnpm -g
```

开发环境下执行，即可
```
pnpm run dev
```

安装包的时候，也请使用pnpm进行安装，如

```
pnpm install typescript -w -D
```

构建脚本见 scripts
pnpm-workspace.yaml 为 pnpm 管理 monorepo 的声明文件
