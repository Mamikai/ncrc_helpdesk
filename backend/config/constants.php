<?php
/* ============================================
   NCRC HELP DESK - SHARED CONSTANTS
   ============================================ */

const ROLES = ['user', 'ict', 'admin'];

const TICKET_STATUSES = ['open', 'inprogress', 'resolved', 'closed'];
const TICKET_PRIORITIES = ['low', 'medium', 'high'];

const ASSET_STATUSES = ['working', 'serviceable', 'requires_servicing', 'in_store', 'faulty', 'faulty_not_serviceable', 'not_serviceable', 'obsolete', 'obsolete_not_rechargeable', 'decommissioned'];
const ASSET_CATEGORIES = ['desktop', 'laptop', 'ups', 'printer', 'network_device', 'tv',
    'air_conditioner', 'software_license', 'ip_phone', 'tablet',
    'boardroom_accessory', 'cctv_camera', 'other'];

const DEFAULT_TEMP_PASSWORD = 'FightCrime01';

// End users in these departments can view (read-only) the asset
// inventory, in addition to ICT/Admin who always can. Everyone else
// with role 'user' cannot see it at all.
const ASSET_VISIBLE_DEPARTMENTS = ['Internal Audit and Risk Assurance', 'Supply Chain Management'];
