-- CreateEnum
CREATE TYPE "DropshipStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "AliExpressToken" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sellerId" TEXT,
    "account" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "refreshExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AliExpressToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DropshipProduct" (
    "id" TEXT NOT NULL,
    "aliexpressId" TEXT NOT NULL,
    "aliexpressUrl" TEXT NOT NULL,
    "originalTitle" TEXT NOT NULL,
    "originalPrice" DECIMAL(12,2) NOT NULL,
    "originalImages" TEXT[],
    "originalDescription" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "markupPrice" DECIMAL(12,2) NOT NULL,
    "images" TEXT[],
    "specs" JSONB,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "condition" "Condition" NOT NULL DEFAULT 'NEW',
    "categoryId" TEXT NOT NULL,
    "status" "DropshipStatus" NOT NULL DEFAULT 'DRAFT',
    "adminId" TEXT NOT NULL,
    "publishedProductId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DropshipProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DropshipProduct_aliexpressId_key" ON "DropshipProduct"("aliexpressId");

-- CreateIndex
CREATE UNIQUE INDEX "DropshipProduct_slug_key" ON "DropshipProduct"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "DropshipProduct_publishedProductId_key" ON "DropshipProduct"("publishedProductId");

-- CreateIndex
CREATE INDEX "DropshipProduct_status_idx" ON "DropshipProduct"("status");

-- CreateIndex
CREATE INDEX "DropshipProduct_adminId_idx" ON "DropshipProduct"("adminId");

-- CreateIndex
CREATE INDEX "DropshipProduct_categoryId_idx" ON "DropshipProduct"("categoryId");

-- AddForeignKey
ALTER TABLE "DropshipProduct" ADD CONSTRAINT "DropshipProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CategoryModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropshipProduct" ADD CONSTRAINT "DropshipProduct_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
