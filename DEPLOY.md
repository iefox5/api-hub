# 部署指南

## 一键部署到 Vercel

所有配置已自动完成，只需获取 Vercel Token 即可部署。

### 步骤 1: 获取 Vercel Token（只需一次）

访问: https://vercel.com/account/tokens

- 点击 "Create Token"
- 名称: `api-hub-deploy`
- Scope: `Full Account`
- 点击 "Create" 并复制 Token

### 步骤 2: 部署

```bash
# 方式 1: 设置环境变量后部署
export VERCEL_TOKEN='your_token_here'
./quick-deploy.sh

# 方式 2: 一行命令直接部署
VERCEL_TOKEN='your_token_here' ./quick-deploy.sh
```

## 后续更新

代码更新后，重新运行部署脚本即可:

```bash
./quick-deploy.sh
```

## 已配置内容

✅ Supabase URL 和 API Key（自动获取）
✅ vercel.json 配置（SPA 路由）
✅ 环境变量配置（.env）
✅ 构建配置（Vite）

## 部署后的 URL

部署成功后，你的应用将发布到:
- `https://api-hub-<随机字符>.vercel.app`（生产环境）

## 自定义域名（可选）

在 Vercel Dashboard 可以绑定自定义域名，但不是必需的。
