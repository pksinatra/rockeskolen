<?php

if (!function_exists('current_user')) {
    require_once $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';
}

if (!function_exists('rs_app_header_h')) {
    function rs_app_header_h(?string $value): string {
        return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
    }
}

if (!function_exists('rs_render_app_header')) {
    function rs_render_app_header(string $active = 'tools'): void {
        $fetchDestination = strtolower((string) ($_SERVER['HTTP_SEC_FETCH_DEST'] ?? ''));
        $explicitEmbed = isset($_GET['embed']) && $_GET['embed'] === '1';
        if ($fetchDestination === 'iframe' || $explicitEmbed) {
            return;
        }

        $user = current_user();
        $isLoggedIn = (bool) $user;
        $accountHref = '/members/account.php';
        $loginHref = '/members/login.php?redirect=' . rawurlencode($_SERVER['REQUEST_URI'] ?? '/tools/');
        ?>
        <header class="rk-app-header">
          <div class="rk-app-header__inner">
            <a class="rk-app-header__brand" href="/" aria-label="Rockeskolen">
              <img src="/images/rock-logo.png" alt="Rockeskolen">
            </a>
            <nav class="rk-app-header__nav" aria-label="Rockeskolen-navigasjon">
              <a href="/"<?= $active === 'home' ? ' aria-current="page"' : '' ?>>Forside</a>
              <a href="/tools/"<?= $active === 'tools' ? ' aria-current="page"' : '' ?>>Verktøy</a>
              <a href="https://portal.rockeskolen.com">Musikkportalen</a>
              <?php if ($isLoggedIn): ?>
                <a class="rk-app-header__account" href="<?= rs_app_header_h($accountHref) ?>">Account</a>
              <?php else: ?>
                <a class="rk-app-header__account" href="<?= rs_app_header_h($loginHref) ?>">Logg inn</a>
              <?php endif; ?>
            </nav>
          </div>
        </header>
        <?php
    }
}
