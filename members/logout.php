<?php
require __DIR__ . '/config.php';
$redirect = $_GET['redirect'] ?? '/members/login.php?logged_out=1';
if (!is_string($redirect)) {
    $redirect = '/members/login.php?logged_out=1';
}
$parsed = parse_url($redirect);
$allowedPortalReturn = is_array($parsed)
    && ($parsed['scheme'] ?? '') === 'https'
    && ($parsed['host'] ?? '') === 'portal.rockeskolen.com'
    && in_array(($parsed['path'] ?? ''), ['/user/login', '/admin-login'], true);
if (!$allowedPortalReturn) {
    $redirect = safe_redirect($redirect);
}
$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
}
session_destroy();
header('Location: ' . $redirect, true, 303);
exit;
