-- ============================================
-- NCRC HELP DESK - REAL ASSET INVENTORY
-- Extracted from: Inventory Updated 8th July 2026.xls
-- 
-- This file contains ALL real assets from the official
-- inventory audit. Load this AFTER schema and required seed,
-- BEFORE going live. This data is permanent production data
-- and must never be deleted by teardown-demo.sql.
-- ============================================
USE ncrc_helpdesk;

-- ---- SERVERS ----
INSERT INTO assets (asset_tag, category, department_id, assigned_to_name, model, serial_number, status, notes) VALUES
('Serverroom groundfloor-mntr02', 'desktop', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'ELITE DESK Monitor', 'SN:CNK5290K7Q', 'working', 'Server Room Ground Floor - Monitor'),
('svrmgrndfl-keybrd01', 'desktop', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'Keyboard', NULL, 'working', 'Server Room Ground Floor'),
('svrmgrndfl-comp-cpu01', 'desktop', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'Desktop CPU', 'SN: SGH542SPPQ', 'working', 'Server Room Ground Floor'),
('svrmgrndfl-comp-keybr01', 'desktop', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'Keyboard', NULL, 'working', 'Server Room Ground Floor'),
('Sverrm-monitor1', 'desktop', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'ELITE DESK Monitor', 'SN: 3CQ6210K13', 'working', 'NCRC APH Server Monitor'),
('svrmgrndfl-comp-cpu02', 'desktop', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'Desktop CPU', 'SN: AUD449036Y', 'working', 'NCRC APH Server CPU');

-- ---- SWITCHES & ROUTERS ----
INSERT INTO assets (asset_tag, category, department_id, assigned_to_name, model, serial_number, status, notes) VALUES
('NCRC/Com_Serv/002', 'network_device', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, '9U Cabinet', NULL, 'working', 'Ground Floor Server Room Cabinet'),
('SVERRM-SWITCH03', 'network_device', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'CISCO C2960X-48LPS-L VO2', 'FOC1916S40L', 'working', 'Ground Floor Switch Label1'),
('SVERRM-SWITCH04', 'network_device', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'Cisco C2960X', 'FCW2004A0YU', 'working', 'Ground Floor Switch Label2'),
('NCRC-ROUTER-001', 'network_device', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'CISCO 2900', 'FGL20221109', 'working', 'Ground Floor Router'),
('SVRMGRNDFL-TELKOM-RTER1', 'network_device', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'Huawei', 'EFY7S19C04000860', 'working', 'Telkom Router Ground Floor');

-- ---- UPS (Uninterruptible Power Supply) ----
INSERT INTO assets (asset_tag, category, department_id, assigned_to_name, model, serial_number, status, notes) VALUES
('NCRC/UPS/026', 'ups', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'Smart UPS 2200RMI2U/3000RMI2U', 'SMT3000RMI2U', 'working', 'Ground Floor Server Room UPS'),
('SVERRM-UPS-1STFLR', 'ups', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'CISCO C1500', 'SMC15001-24 / AS1526220356', 'working', '1st Floor Heavy Duty UPS');

-- ---- WIFI ACCESS POINTS ----
INSERT INTO assets (asset_tag, category, department_id, assigned_to_name, model, serial_number, status, notes) VALUES
('GRND-ROUTER01', 'network_device', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'UBIQUITI', '1650GF09FC256EA69-rWPdAf', 'working', 'WIFI Reception Area Ground Floor'),
('GRNDFRL-WIFI-ROUTER02', 'network_device', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'UBIQUITI', '1501K0418D6CA41CB', 'working', 'WIFI Deputy Director Ground Floor'),
('WIFI-BOARDROOM-1STFLR-01', 'network_device', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'UBIQUITI', '1703GF09FC2809A46', 'working', 'WIFI BoardRoom 1st Floor'),
('1STFLR-WIFI-ROUTER01', 'network_device', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'UBIQUITI', '1905GFCECDA68F6B0-WKu9g4', 'working', 'WIFI BoardRoom Kitchen 1st Floor'),
('1STFLR-WIFI-ROUTER02', 'network_device', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'UBIQUITI', '1905GFCECDA68F82E-pasKBI', 'working', 'WIFI BoardRoom Entry Area 2 1st Floor'),
('WIFI-SITUATION-ROOM', 'network_device', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'UBIQUITI', '1703GF09FC280997B-s77BMr', 'working', 'WIFI Situation Room');

-- ---- 1ST FLOOR SWITCHES ----
INSERT INTO assets (asset_tag, category, department_id, assigned_to_name, model, serial_number, status, notes) VALUES
('SVERRM-Cabinet01', 'network_device', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'Cisco 42U Cabinet', NULL, 'working', '1st Floor Server Cabinet'),
('SVERRM-SWITCH-NEW', 'network_device', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'CISCO C9200-DN-E-24', 'FD01321X23P', 'working', 'New Switch 1st Floor'),
('SVERRM-COMP-UPS01', 'network_device', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'CISCO C2960', 'FCW2004A0YU', 'working', 'Switch 2 1st Floor'),
('SVERRM-SWITCH01', 'network_device', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'SG200-26P', 'DNI2223016N', 'working', 'Switch 3 1st Floor');

-- ============================================
-- Notes for future updates:
-- - All assets are marked as status 'working' per inventory
-- - Asset tags are extracted from the TAG column
-- - Department is set to 'ICT' for infrastructure equipment
-- - All categories map to the assets table ENUM values:
--   (desktop, laptop, ups, printer, network_device, tv,
--    air_conditioner, software_license, ip_phone, tablet,
--    boardroom_accessory, cctv_camera, other)
-- - To add more assets later, use the backend API endpoint
--   or add rows here and re-import via phpMyAdmin
-- ============================================
