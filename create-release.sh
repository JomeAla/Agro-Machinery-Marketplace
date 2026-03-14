#!/bin/bash

# GitHub Release Creation Script
# Run this script to create the v1.0.0 release on GitHub

# Note: You need a GitHub Personal Access Token with 'repo' scope
# Create one at: https://github.com/settings/tokens

# Set your token here or as environment variable GITHUB_TOKEN
GITHUB_TOKEN=${GITHUB_TOKEN:-""}

if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GitHub token not set."
    echo "Please set your GitHub token:"
    echo "  export GITHUB_TOKEN=your_personal_access_token"
    echo ""
    echo "Or create one at: https://github.com/settings/tokens"
    echo "Token needs 'repo' scope."
    exit 1
fi

REPO="JomeAla/Agro-Machinery-Marketplace"
TAG="v1.0.0"
TITLE="v1.0.0 - Initial Production Release"

# Release body
BODY='🎉 Welcome to Agro Machinery B2B Marketplace v1.0.0

We are thrilled to announce the first major release of the Agro Machinery B2B Marketplace - Nigeria'"'"'s premier B2B platform for agricultural machinery.

## ✨ What'"'"'s New

### Core Features
- User Authentication - JWT-based auth with role-based access control
- Product Catalog with categories
- RFQ System for heavy machinery
- Order Management with status tracking
- Payment Integration - Paystack & Flutterwave with B2B Escrow

### Support Features
- Support Tickets system
- FAQ Knowledge Base
- Messaging between buyers and sellers

### Business Features
- Promotions (banners, discount codes, featured products)
- Financing/Leasing
- Freight/Logistics for Nigeria
- Maintenance and Warranty

## 🐛 Bug Fixes
- Docker build issues fixed
- Prisma binary targets updated
- Dockerfile dependencies fixed

## 📚 Documentation
- README.md - Project overview
- API.md - Complete API documentation
- HOWTO.md - Step-by-step guides

## ⚠️ Breaking Changes
None

## 🚀 Getting Started
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Admin: http://localhost:3000/admin

Default admin: admin@agromarket.com / Admin@123'

echo "Creating GitHub Release..."

# Create the release using GitHub API
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO/releases" \
  -d "{
    \"tag_name\": \"$TAG\",
    \"name\": \"$TITLE\",
    \"body\": $(echo "$BODY" | jq -Rs .),
    \"draft\": false,
    \"prerelease\": false,
    \"generate_release_notes\": false
  }"

echo ""
echo "Release created successfully!"
echo "View at: https://github.com/$REPO/releases/tag/$TAG"
