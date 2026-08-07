-- ============================================
-- NCRC HELP DESK MANAGEMENT SYSTEM
-- MySQL Schema
-- Naming: snake_case tables/columns, no hyphens
-- ============================================

CREATE DATABASE IF NOT EXISTS ncrc_helpdesk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ncrc_helpdesk;

-- ---- Users ----
-- No self-registration: accounts are created only via
-- backend/api/users/create.php (Admin-only). Department is
-- free text, set by admin at creation, admin-editable anytime.
-- must_reset_password forces a password change on first login.
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'ict', 'admin') NOT NULL DEFAULT 'user',
    department VARCHAR(100),
    phone VARCHAR(20),
    must_reset_password TINYINT(1) NOT NULL DEFAULT 1,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_user_active ON users(is_active);

-- ---- SLA rules ----
-- Response/resolution time targets per priority, in hours.
-- Powers the real "SLA Compliance %" stat on the Admin dashboard.
CREATE TABLE sla_rules (
    sla_id INT AUTO_INCREMENT PRIMARY KEY,
    priority ENUM('low', 'medium', 'high') NOT NULL UNIQUE,
    response_hours INT NOT NULL,
    resolution_hours INT NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1
);

-- ---- Tickets (core MVP module) ----
CREATE TABLE tickets (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(20) NOT NULL UNIQUE,
    submitted_by INT NOT NULL,
    assigned_to INT NULL,
    department VARCHAR(100),
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    status ENUM('open', 'inprogress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    sla_due_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    closed_at DATETIME NULL,
    FOREIGN KEY (submitted_by) REFERENCES users(user_id),
    FOREIGN KEY (assigned_to) REFERENCES users(user_id)
);

CREATE INDEX idx_ticket_number ON tickets(ticket_number);
CREATE INDEX idx_ticket_status ON tickets(status);
CREATE INDEX idx_ticket_priority ON tickets(priority);
CREATE INDEX idx_ticket_submitted_by ON tickets(submitted_by);
CREATE INDEX idx_ticket_assigned_to ON tickets(assigned_to);

-- ---- Ticket comments ----
-- is_internal: ICT/Admin-only notes, hidden from the end user who filed the ticket.
CREATE TABLE ticket_comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    author_id INT NOT NULL,
    comment TEXT NOT NULL,
    is_internal TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id),
    FOREIGN KEY (author_id) REFERENCES users(user_id)
);

CREATE INDEX idx_comment_ticket ON ticket_comments(ticket_id);

-- ---- Server room access logs ----
CREATE TABLE server_access_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP NULL,
    authorized TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ---- Assets ----
-- One core table for every category from the real inventory
-- (desktop, laptop, ups, printer, network_device, tv, air_conditioner,
-- software_license, ip_phone, tablet, boardroom_accessory, cctv_camera, other).
-- assigned_to_name is free text (per agreement — not every asset holder
-- has a Help Desk login); assigned_to_user_id links to a real account
-- when that person also happens to be a system user.
CREATE TABLE assets (
    asset_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_tag VARCHAR(50) NOT NULL UNIQUE,
    category ENUM('desktop', 'laptop', 'ups', 'printer', 'network_device', 'tv',
                   'air_conditioner', 'software_license', 'ip_phone', 'tablet',
                   'boardroom_accessory', 'cctv_camera', 'other') NOT NULL,
    department VARCHAR(100),
    assigned_to_name VARCHAR(150),
    assigned_to_user_id INT NULL,
    model VARCHAR(150),
    serial_number VARCHAR(150),
    location VARCHAR(150),
    status ENUM('working', 'requires_servicing', 'in_store', 'decommissioned') NOT NULL DEFAULT 'in_store',
    notes TEXT,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(user_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE INDEX idx_asset_tag ON assets(asset_tag);
CREATE INDEX idx_asset_category ON assets(category);
CREATE INDEX idx_asset_status ON assets(status);

-- ---- Asset components ----
-- Only used for multi-part bundles (mainly desktops: CPU + keyboard +
-- monitor each separately tagged/serialized, matching the real inventory sheet).
CREATE TABLE asset_components (
    component_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    component_type VARCHAR(50) NOT NULL, -- 'CPU' | 'Keyboard' | 'Monitor' | ...
    component_tag VARCHAR(100),
    component_serial VARCHAR(100),
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id) ON DELETE CASCADE
);

-- ---- Asset movement history ----
CREATE TABLE asset_movement (
    movement_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    moved_by INT NOT NULL,
    to_user_id INT NULL,
    to_user_name VARCHAR(150),
    notes TEXT,
    moved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    FOREIGN KEY (moved_by) REFERENCES users(user_id),
    FOREIGN KEY (to_user_id) REFERENCES users(user_id)
);

-- ---- Documentation repository ----
CREATE TABLE documents (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    uploaded_by INT NOT NULL,
    visible_to_role ENUM('user', 'ict', 'admin') DEFAULT 'user',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
);

-- ---- Announcements ----
-- Admin-posted, shown on every dashboard.
CREATE TABLE announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    body TEXT NOT NULL,
    posted_by INT NOT NULL,
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (posted_by) REFERENCES users(user_id)
);

-- ---- Notifications ----
-- In-app bell icon. Generated on ticket status changes, assignments, etc.
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX idx_notification_user ON notifications(user_id);
CREATE INDEX idx_notification_read ON notifications(is_read);

-- ---- Audit log ----
-- Lightweight change trail: who changed what, on which record.
CREATE TABLE audit_log (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
