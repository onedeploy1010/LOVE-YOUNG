-- ============================================
-- 030: Partner Bank Accounts
-- ============================================

CREATE TABLE IF NOT EXISTS partner_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT NOT NULL REFERENCES partners(id),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_bank_accounts_partner ON partner_bank_accounts(partner_id);

-- RLS
ALTER TABLE partner_bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access partner_bank_accounts" ON partner_bank_accounts;
CREATE POLICY "Admin full access partner_bank_accounts"
  ON partner_bank_accounts FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid()::text AND members.role = 'admin'));

DROP POLICY IF EXISTS "Partner manage own bank accounts" ON partner_bank_accounts;
CREATE POLICY "Partner manage own bank accounts"
  ON partner_bank_accounts FOR ALL
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()::text));

-- Ensure only one default per partner
CREATE OR REPLACE FUNCTION ensure_single_default_bank()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE partner_bank_accounts
    SET is_default = false
    WHERE partner_id = NEW.partner_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_default_bank ON partner_bank_accounts;
CREATE TRIGGER trg_single_default_bank
  BEFORE INSERT OR UPDATE ON partner_bank_accounts
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_bank();
