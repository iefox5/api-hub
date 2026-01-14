#!/bin/bash
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== API Hub 自动部署脚本 ===${NC}\n"

# 1. 检查 Vercel Token
if [ -z "$VERCEL_TOKEN" ]; then
  echo -e "${RED}错误: 未找到 VERCEL_TOKEN 环境变量${NC}"
  echo ""
  echo "请按以下步骤获取 Token："
  echo "1. 访问: https://vercel.com/account/tokens"
  echo "2. 创建新 Token (名称随意，如: api-hub-deploy)"
  echo "3. 复制 Token 并运行:"
  echo ""
  echo -e "${YELLOW}   export VERCEL_TOKEN=your_token_here${NC}"
  echo ""
  echo "然后重新运行此脚本"
  exit 1
fi

echo -e "${GREEN}✓${NC} Vercel Token 已配置"

# 2. 检查环境变量文件
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo -e "${YELLOW}⚠${NC}  未找到 .env 文件，从 .env.example 创建..."
    cp .env.example .env
    echo -e "${YELLOW}⚠${NC}  请编辑 .env 文件，填入真实的 Supabase 配置"
    echo ""
    read -p "按 ENTER 继续（确保已配置 .env）..."
  else
    echo -e "${RED}错误: 未找到 .env 或 .env.example 文件${NC}"
    exit 1
  fi
fi

# 3. 读取环境变量
echo -e "\n${GREEN}=== 读取环境变量 ===${NC}"
source .env

if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}错误: .env 文件缺少必要的环境变量${NC}"
  echo "请确保以下变量已配置："
  echo "  - VITE_SUPABASE_URL"
  echo "  - VITE_SUPABASE_ANON_KEY"
  exit 1
fi

echo -e "${GREEN}✓${NC} VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}"
echo -e "${GREEN}✓${NC} VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:0:20}..."

# 4. 部署到 Vercel
echo -e "\n${GREEN}=== 开始部署 ===${NC}"

# 首次部署会创建项目
vercel deploy \
  --token="$VERCEL_TOKEN" \
  --name="api-hub" \
  --env VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --env VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  --yes \
  --prod

echo -e "\n${GREEN}=== 部署成功! ===${NC}"
echo ""
echo "后续部署只需运行:"
echo -e "${YELLOW}  ./deploy.sh${NC}"
echo ""
