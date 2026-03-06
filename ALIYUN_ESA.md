# 阿里云 ESA Pages 构建说明

## 已为修复「npm install 失败」做的修改

1. **`.npmrc`**  
   使用国内镜像 `https://registry.npmmirror.com`，避免构建时访问 npm 官方源超时或失败。

2. **`esa.jsonc`**  
   阿里云 ESA 会读取该文件，其中：
   - **installCommand**：使用镜像执行 `npm install`，保证安装成功。
   - **buildCommand**：`npm run build`。
   - **assets**：静态资源目录，当前为 `.next`（Next 默认构建输出）。

3. **`package.json` 的 `engines`**  
   指定 Node `>=18.0.0`，与阿里云构建环境一致。

## 若仍然安装失败

在 **阿里云控制台** 的「构建配置」里，把 **安装命令** 改为（二选一）：

```bash
npm install --registry https://registry.npmmirror.com
```

或（跳过可选依赖，有时能避免因可选包安装失败导致整次安装失败）：

```bash
npm install --registry https://registry.npmmirror.com --no-optional
```

若项目已提交 `package-lock.json`，也可尝试：

```bash
npm ci --registry https://registry.npmmirror.com
```

## 说明

- 仓库中已包含 `esa.jsonc` 时，**其配置优先于控制台**，一般无需在控制台再填安装/构建命令。
- 构建通过后，若发现静态资源或路由不对，再根据 ESA 要求调整 `esa.jsonc` 里 `assets.directory`（例如改为静态导出目录 `out` 等）。
