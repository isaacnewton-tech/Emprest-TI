BEGIN;

/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,id]` on the table `equipment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "EquipmentStatus" ADD VALUE 'emprestado';

-- CreateTable
CREATE TABLE "loans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "due_at" TIMESTAMPTZ(3) NOT NULL,
    "returned_at" TIMESTAMPTZ(3),

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "resource_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loans_tenant_id_user_id_returned_at_due_at_idx" ON "loans"("tenant_id", "user_id", "returned_at", "due_at");

-- CreateIndex
CREATE INDEX "audit_events_tenant_id_created_at_idx" ON "audit_events"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_tenant_id_id_key" ON "equipment"("tenant_id", "id");

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_user_id_tenant_id_fkey" FOREIGN KEY ("user_id", "tenant_id") REFERENCES "memberships"("user_id", "tenant_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_tenant_id_equipment_id_fkey" FOREIGN KEY ("tenant_id", "equipment_id") REFERENCES "equipment"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE public.loans ADD CONSTRAINT loans_due_after_creation CHECK (due_at > created_at);
CREATE UNIQUE INDEX loans_one_open_per_equipment ON public.loans (tenant_id, equipment_id)
  WHERE returned_at IS NULL;

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY loans_read_self ON public.loans FOR SELECT
USING (
  CURRENT_USER = 'authenticated'
  AND user_id::text = (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  AND EXISTS (
    SELECT 1 FROM public.memberships AS m
    WHERE m.tenant_id = loans.tenant_id AND m.user_id = loans.user_id
  )
);

CREATE POLICY audit_events_private ON public.audit_events
  AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);

CREATE FUNCTION public.reject_audit_event_changes() RETURNS trigger
LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Eventos de auditoria só aceitam inserção.' USING ERRCODE = '42501';
END;
$$;

CREATE TRIGGER audit_events_append_only
  BEFORE UPDATE OR DELETE OR TRUNCATE ON public.audit_events
  FOR EACH STATEMENT EXECUTE FUNCTION public.reject_audit_event_changes();

REVOKE ALL ON TABLE public.loans, public.audit_events FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_audit_event_changes() FROM PUBLIC;
DO $$
DECLARE
  gateway_role name;
BEGIN
  FOR gateway_role IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role')
  LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.loans, public.audit_events FROM %I', gateway_role);
    EXECUTE format('REVOKE ALL ON FUNCTION public.reject_audit_event_changes() FROM %I', gateway_role);
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT SELECT ON TABLE public.loans TO authenticated;
  END IF;
END;
$$;

COMMIT;
