<?php
/* ============================================
   NCRC HELP DESK - EMAIL NOTIFICATIONS
   Stretch goal — not yet implemented.
   TODO: backend - install PHPMailer via composer,
   configure SMTP, call from wherever notifyUser()
   is already being called.
   ============================================ */

function sendNotificationEmail(string $to, string $subject, string $body): bool {
    error_log("[MAILER STUB] Would send to $to — Subject: $subject");
    return true;
}
