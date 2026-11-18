-- CreateTable
CREATE TABLE "countries" (
    "code" CHAR(2) NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_si" TEXT NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "monthly_minor" INTEGER NOT NULL,
    "methods" TEXT[],
    "needs_consent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "categories" (
    "key" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_si" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("key")
);
