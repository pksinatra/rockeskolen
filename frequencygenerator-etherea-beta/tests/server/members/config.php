<?php
// Test-only session fixture. This directory is never copied into dist/.
// The production adapter loads the real /members/config.php instead.
define('PRO_ROLES', ['pro','vip','admin']);
function refresh_user_from_db(): void {
    if (($_COOKIE['fg_test_role'] ?? '') === 'unavailable') throw new RuntimeException('Test unavailable');
    $GLOBALS['test_user'] = isset($_COOKIE['fg_test_role']) ? ['role'=>$_COOKIE['fg_test_role']] : null;
}
function chordlink_db_available(): bool { return ($_COOKIE['fg_test_role'] ?? '') !== 'unavailable'; }
function current_user() { return $GLOBALS['test_user'] ?? null; }
// Canonical role check, verified against the live ChordLink implementation.
function is_pro_user(?array $u = null): bool {
    $u = $u ?: current_user();
    if (!$u) return false;
    return in_array(strtolower($u['role']), PRO_ROLES, true);
}
