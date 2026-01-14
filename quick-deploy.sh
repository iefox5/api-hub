#!/bin/bash
set -e

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════╗${NC}"
echo -e "${BLUE}║   API Hub - 快速部署 Vercel    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════╝${NC}\n"

# 检查 Vercel Token
if [ -z "$VERCEL_TOKEN" ]; then
  echo -e "${YELLOW}需要 Vercel Token 才能部署${NC}\n"
  echo "请访问: ${BLUE}https://vercel.com/account/tokens${NC}"
  echo ""
  echo "创建 Token 后运行:"
  echo -e "${GREEN}  export VERCEL_TOKEN='your_token_here'${NC}"
  echo -e "${GREEN}  ./quick-deploy.sh${NC}"
  echo ""
  echo "或者一行命令:"
  echo -e "${GREEN}  VERCEL_TOKEN='your_token' ./quick-deploy.sh${NC}"
  echo ""
  exit 1
fi

# 读取环境变量
source .env

echo -e "${GREEN}✓${NC} Supabase URL: $VITE_SUPABASE_URL"
echo -e "${GREEN}✓${NC} Anon Key: ${VITE_SUPABASE_ANON_KEY:0:30}...\n"

echo -e "${YELLOW}开始部署...${NC}\n"

# 部署
vercel deploy \
  --token="$VERCEL_TOKEN" \
  --name="api-hub" \
  --build-env VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-env VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  --yes \
  --prod

echo -e "\n${GREEN}╔══════════════════════════════════╗${NC}"
echo -e "${GREEN}║      部署成功! 🎉              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════╝${NC}\n"
