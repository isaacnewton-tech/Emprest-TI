BEGIN;

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('colaborador', 'operacoes');

-- CreateEnum
CREATE TYPE "EquipmentCategory" AS ENUM ('notebook', 'monitor', 'cabo', 'camera');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('disponivel', 'manutencao');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("user_id","tenant_id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "patrimonio" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" "EquipmentCategory" NOT NULL,
    "situacao" "EquipmentStatus" NOT NULL,
    "photo_url" TEXT NOT NULL,
    "photo_source" JSONB NOT NULL,
    "first_used_at" TIMESTAMPTZ(3),

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "memberships_tenant_id_idx" ON "memberships"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_tenant_id_patrimonio_key" ON "equipment"("tenant_id", "patrimonio");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Supabase fornece o papel autenticado e as claims verificadas no gateway.
-- PostgreSQL local sem esses papéis também aplica a migration do zero.
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY memberships_read_self ON public.memberships FOR SELECT
USING (
  CURRENT_USER = 'authenticated'
  AND user_id::text = (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
);

CREATE POLICY tenants_read_member ON public.tenants FOR SELECT
USING (
  CURRENT_USER = 'authenticated'
  AND EXISTS (SELECT 1 FROM public.memberships AS m WHERE m.tenant_id = tenants.id)
);

CREATE POLICY equipment_read_member ON public.equipment FOR SELECT
USING (
  CURRENT_USER = 'authenticated'
  AND EXISTS (SELECT 1 FROM public.memberships AS m WHERE m.tenant_id = equipment.tenant_id)
);

REVOKE ALL ON TABLE public.tenants, public.memberships, public.equipment FROM PUBLIC;
DO $$
DECLARE
  gateway_role name;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.tenants, public.memberships, public.equipment FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.tenants, public.memberships, public.equipment FROM authenticated;
    GRANT SELECT ON TABLE public.tenants, public.memberships, public.equipment TO authenticated;
  END IF;

  -- Prisma cria esta tabela antes do DDL. Ela pode herdar grants em projetos antigos.
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
    CREATE POLICY prisma_migrations_private ON public._prisma_migrations
      AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
    REVOKE ALL ON TABLE public._prisma_migrations FROM PUBLIC;
    FOR gateway_role IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role')
    LOOP
      EXECUTE format('REVOKE ALL ON TABLE public._prisma_migrations FROM %I', gateway_role);
    END LOOP;
  END IF;
END;
$$;

COMMIT;
