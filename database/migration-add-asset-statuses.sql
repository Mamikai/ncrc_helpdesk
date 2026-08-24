-- NCRC Help Desk: add inventory statuses to an existing database
-- Run once after schema.sql has already been imported.
USE ncrc_helpdesk;

ALTER TABLE assets
    MODIFY status ENUM('working', 'serviceable', 'requires_servicing', 'in_store', 'faulty', 'faulty_not_serviceable', 'not_serviceable', 'obsolete', 'obsolete_not_rechargeable', 'decommissioned')
    NOT NULL DEFAULT 'in_store';

INSERT IGNORE INTO assets (asset_tag, category, model, serial_number, status, notes) VALUES
('IDLE-EXCEL-001', 'other', 'Fire Extinguishers', 'None indicated', 'not_serviceable', 'Handed over to procurement'),
('IDLE-EXCEL-002', 'other', 'UPS', '242006509309', 'faulty', 'Handed over to procurement'),
('IDLE-EXCEL-003', 'other', 'LG7 Display', 'MQ90CRINE9P081310KL', 'faulty_not_serviceable', 'Handed over to procurement'),
('IDLE-EXCEL-004', 'other', 'VGA Cables', 'None indicated', 'obsolete', 'Handed over to procurement'),
('IDLE-EXCEL-005', 'other', 'AA Batteries', 'None indicated', 'obsolete_not_rechargeable', 'Handed over to procurement'),
('IDLE-EXCEL-006', 'other', 'Toshiba Portege R30', '7E06290H', 'requires_servicing', 'Handed over to procurement'),
('STATUS-EXAMPLE-001', 'other', 'Serviceable Demo Device', NULL, 'serviceable', 'Status coverage example'),
('STATUS-EXAMPLE-002', 'other', 'Unassigned Store Device', NULL, 'in_store', 'Status coverage example'),
('STATUS-EXAMPLE-003', 'other', 'Decommissioned Legacy Device', NULL, 'decommissioned', 'Status coverage example');
