#!/bin/bash
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════╗"
echo "║   API Hub - 一键部署到 Vercel           ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================
# 1. 检查 Vercel Token
# ============================================
echo -e "\n${YELLOW}[1/4]${NC} 检查 Vercel Token..."

if [ -z "$VERCEL_TOKEN" ]; then
  echo -e "${RED}✗${NC} 未找到 VERCEL_TOKEN 环境变量"
  echo ""
  echo -e "${BLUE}请按以下步骤操作：${NC}"
  echo ""
  echo "1. 打开浏览器访问: ${YELLOW}https://vercel.com/account/tokens${NC}"
  echo "2. 点击 'Create Token'"
  echo "3. 名称填: ${GREEN}api-hub-deploy${NC}"
  echo "4. Scope: Full Account"
  echo "5. 点击 'Create' 并复制 Token"
  echo ""
  echo "然后运行:"
  echo -e "${GREEN}  export VERCEL_TOKEN='your_token_here'${NC}"
  echo -e "${GREEN}  ./setup-and-deploy.sh${NC}"
  echo ""
  exit 1
fi

echo -e "${GREEN}✓${NC} Vercel Token 已配置"

# ============================================
# 2. 获取 Supabase 配置
# ============================================
echo -e "\n${YELLOW}[2/4]${NC} 获取 Supabase 配置..."

SUPABASE_PROJECT_ID="gujeqnmixjabgjsouceb"
SUPABASE_URL="https://${SUPABASE_PROJECT_ID}.supabase.co"

# 尝试从 Supabase CLI 获取 keys
echo "正在获取 Supabase API Keys..."

# 方式1: 尝试从已登录的 supabase CLI 获取
ANON_KEY=$(supabase projects api-keys --project-ref "$SUPABASE_PROJECT_ID" 2>/dev/null | grep "anon key" | awk '{print $NF}' || echo "")

if [ -z "$ANON_KEY" ]; then
  echo -e "${YELLOW}⚠${NC}  无法自动获取 Supabase Keys，需要手动配置"
  echo ""
  echo -e "${BLUE}请访问:${NC} ${YELLOW}https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/settings/api${NC}"
  echo ""
  echo "复制 'anon' 'public' key，然后运行:"
  echo -e "${GREEN}  export SUPABASE_ANON_KEY='your_anon_key_here'${NC}"
  echo -e "${GREEN}  ./setup-and-deploy.sh${NC}"
  echo ""

  # 检查环境变量
  if [ -z "$SUPABASE_ANON_KEY" ]; then
    exit 1
  else
    ANON_KEY="$SUPABASE_ANON_KEY"
  fi
fi

echo -e "${GREEN}✓${NC} VITE_SUPABASE_URL: ${SUPABASE_URL}"
echo -e "${GREEN}✓${NC} VITE_SUPABASE_ANON_KEY: ${ANON_KEY:0:30}..."

# ============================================
# 3. 创建 .env 文件（本地开发用）
# ============================================
echo -e "\n${YELLOW}[3/4]${NC} 创建本地环境配置..."

cat > .env <<EOF
# Supabase Configuration
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${ANON_KEY}
EOF

echo -e "${GREEN}✓${NC} .env 文件已创建"

# ============================================
# 4. 部署到 Vercel
# ============================================
echo -e "\n${YELLOW}[4/4]${NC} 部署到 Vercel..."

echo "正在部署..."

DEPLOY_OUTPUT=$(vercel deploy \
  --token="$VERCEL_TOKEN" \
  --name="api-hub" \
  --build-env VITE_SUPABASE_URL="$SUPABASE_URL" \
  --build-env VITE_SUPABASE_ANON_KEY="$ANON_KEY" \
  --yes \
  --prod 2>&1)

# 提取部署 URL
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[^ ]*\.vercel\.app' | head -1)

# ============================================
# 完成
# ============================================
echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════╗"
echo "║          部署成功! 🎉                    ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "访问地址: ${BLUE}${DEPLOY_URL}${NC}"
echo ""
echo -e "${YELLOW}后续更新只需运行:${NC}"
echo -e "${GREEN}  vercel --prod --token=\$VERCEL_TOKEN${NC}"
echo ""
echo -e "${YELLOW}或者使用简化脚本:${NC}"
echo -e "${GREEN}  ./deploy.sh${NC}"
echo ""
