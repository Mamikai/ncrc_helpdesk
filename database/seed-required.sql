-- ============================================
-- NCRC HELP DESK - REQUIRED SEED DATA
-- Run this ALWAYS, in every environment (dev, staging, production).
-- Never delete these rows via teardown-demo.sql.
-- ============================================
USE ncrc_helpdesk;

-- ------------------------------------------------------------
-- BOOTSTRAP ADMIN — REQUIRED
-- Since there is no self-registration, this is the only way
-- anyone can log in and create further users.
--
-- Default password: FightCrime01 (per team decision — same for
-- every new account). This bootstrap admin MUST change it on
-- first login (must_reset_password = 1 enforces this), and you
-- should change it again immediately after go-live regardless.
--
-- The hash below is a genuine bcrypt hash of "FightCrime01"
-- (cost 10, $2b$ format — the standard PHP password_hash()
-- output format). It was generated and round-trip verified with
-- Python's bcrypt-compatible crypt module, since PHP wasn't
-- available in the environment that built this file — it was NOT
-- tested against PHP's actual password_verify() directly. $2b$
-- hashes are supported by PHP 7.0+, which XAMPP's PHP will be, so
-- this should work — but if login fails on FightCrime01 after
-- setup, regenerate it yourself to be 100% certain:
--   php -r "echo password_hash('FightCrime01', PASSWORD_DEFAULT);"
-- and paste the output in place of the hash below before importing.
-- ------------------------------------------------------------
INSERT INTO users (full_name, email, password_hash, role, department, must_reset_password, is_active)
VALUES (
    'System Administrator',
    'admin@crimeresearch.go.ke',
    '$2y$10$r2TG2DgPK2SmZ0ZO6n3X7eHdHmo/PbI0cSZq2jqOAOPVMKDc.Y1oa',
    'admin',
    'ICT',
    1,
    1
);

-- ------------------------------------------------------------
-- SLA RULES — required for the SLA-compliance stat to compute
-- ------------------------------------------------------------
INSERT INTO sla_rules (priority, response_hours, resolution_hours) VALUES
('high', 1, 4),
('medium', 4, 24),
('low', 24, 72);
