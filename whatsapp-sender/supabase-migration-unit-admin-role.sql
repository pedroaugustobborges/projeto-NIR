-- Migration: Add 'unit_admin' role to app_users
-- Admin de Unidade: can manage users for their assigned hospitals only.
-- Cannot create or elevate users to 'admin' (Administrador Corporativo).

-- Drop existing role check constraint and re-create with the new role value.
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;

ALTER TABLE app_users
  ADD CONSTRAINT app_users_role_check
  CHECK (role IN ('admin', 'unit_admin', 'user'));

-- Index to speed up role-based queries (e.g. listing all unit_admins of a hospital)
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
