<?php
declare(strict_types=1);

require_once __DIR__ . '/subscriptions.php';

function rs_stripe_datetime(mixed $timestamp): ?string {
    $value = (int)$timestamp;
    return $value > 0 ? gmdate('Y-m-d H:i:s', $value) : null;
}

function rs_stripe_subscription_period(object $subscription, ?object $item): array {
    $start = $subscription->current_period_start ?? $item?->current_period_start ?? null;
    $end = $subscription->current_period_end ?? $item?->current_period_end ?? null;
    return [rs_stripe_datetime($start), rs_stripe_datetime($end)];
}

function rs_local_subscription_status(string $status): string {
    return match ($status) {
        'incomplete_expired' => 'expired',
        'paused' => 'paused',
        'active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete' => $status,
        default => 'expired',
    };
}

/**
 * Finds or creates the local account represented by a paid checkout.
 */
function rs_resolve_membership_user(PDO $pdo, int $userId, string $email, bool $create): ?array {
    if ($userId > 0) {
        $stmt = $pdo->prepare('SELECT id, email, role FROM ' . USER_TABLE . ' WHERE id = ? AND is_active = 1');
        $stmt->execute([$userId]);
        if ($user = $stmt->fetch(PDO::FETCH_ASSOC)) {
            return $user;
        }
    }

    $email = strtolower(trim($email));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return null;
    }

    $stmt = $pdo->prepare('SELECT id, email, role FROM ' . USER_TABLE . ' WHERE email = ? AND is_active = 1');
    $stmt->execute([$email]);
    if ($user = $stmt->fetch(PDO::FETCH_ASSOC)) {
        return $user;
    }
    if (!$create) {
        return null;
    }

    try {
        $passwordHash = password_hash(bin2hex(random_bytes(24)), PASSWORD_DEFAULT);
        $insert = $pdo->prepare(
            'INSERT INTO ' . USER_TABLE . ' (email, password_hash, is_active, role)
             VALUES (?, ?, 1, ?)'
        );
        $insert->execute([$email, $passwordHash, 'free']);
        return ['id' => (int)$pdo->lastInsertId(), 'email' => $email, 'role' => 'free', 'new' => true];
    }
    catch (PDOException $exception) {
        // A webhook and the return page can legitimately race to create the
        // same account. The unique e-mail key makes the loser re-read it.
        if ((string)$exception->getCode() !== '23000') {
            throw $exception;
        }
        $stmt->execute([$email]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }
}

function rs_issue_password_setup_email(string $email, int $userId): void {
    global $pdo;
    $token = bin2hex(random_bytes(32));
    $hash = hash('sha256', $token);
    $stmt = $pdo->prepare(
        'UPDATE ' . USER_TABLE . '
            SET password_reset_token = ?,
                password_reset_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR),
                password_setup_required = 1
          WHERE id = ?'
    );
    $stmt->execute([$hash, $userId]);

    $link = 'https://rockeskolen.com/members/reset.php?token=' . rawurlencode($token);
    $headers = [
        'From: Rockeskolen <post@rockeskolen.com>',
        'Reply-To: post@rockeskolen.com',
        'Content-Type: text/plain; charset=UTF-8',
    ];
    if (!mail(
        $email,
        'VIP aktivert – opprett passord',
        "Hei!\n\nVIP-medlemskapet ditt er aktivert.\n\nOpprett passord her:\n{$link}\n\nLenken er gyldig i 1 time. Du kan alltid be om en ny lenke fra innloggingssiden.\n\n– Rockeskolen",
        implode("\r\n", $headers)
    )) {
        error_log('VIP password setup email could not be sent for membership user ' . $userId);
    }
}

/**
 * Notifies Drupal without making a confirmed payment dependent on Drupal.
 */
function rs_notify_drupal_vip_grant(int $membershipUserId, bool $active): string {
    $secret = getenv('CHORDLINK_ROLE_SYNC_SECRET') ?: '';
    if ($secret === '') {
        throw new RuntimeException('Drupal role synchronization secret is unavailable.');
    }
    $payload = json_encode([
        'membership_user_id' => $membershipUserId,
        'active' => $active,
    ], JSON_THROW_ON_ERROR);
    $timestamp = (string)time();
    $signature = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);
    $handle = curl_init('https://portal.rockeskolen.com/members/payment-grant');
    curl_setopt_array($handle, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-Rockeskolen-Timestamp: ' . $timestamp,
            'X-Rockeskolen-Signature: ' . $signature,
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
    ]);
    $response = curl_exec($handle);
    $status = (int)curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    if ($response === false || !in_array($status, [200, 202], true)) {
        throw new RuntimeException('Drupal role synchronization request failed with HTTP ' . $status . '.');
    }
    return $status === 202 ? 'pending_identity_link' : 'linked';
}

/**
 * Upserts the Stripe entitlement. Safe to call from both webhook and return page.
 */
function rs_store_stripe_subscription(PDO $pdo, object $subscription, ?array $checkoutMetadata = null): array {
    $subscriptionId = (string)($subscription->id ?? '');
    if ($subscriptionId === '') {
        throw new RuntimeException('Stripe subscription ID is missing.');
    }

    $metadata = $subscription->metadata ?? null;
    $metadataUserId = (int)($metadata->user_id ?? 0);
    $metadataEmail = (string)($metadata->email ?? '');
    $metadataPlan = (string)($metadata->type ?? '');
    if ($checkoutMetadata !== null) {
        $metadataUserId = (int)($checkoutMetadata['user_id'] ?? $metadataUserId);
        $metadataEmail = (string)($checkoutMetadata['email'] ?? $metadataEmail);
        $metadataPlan = (string)($checkoutMetadata['type'] ?? $metadataPlan);
    }

    $existing = $pdo->prepare(
        "SELECT s.user_id, s.plan, u.email
           FROM chordlink_subscriptions s
           JOIN " . USER_TABLE . " u ON u.id = s.user_id
          WHERE s.provider = 'stripe' AND s.provider_subscription_id = ?
          LIMIT 1"
    );
    $existing->execute([$subscriptionId]);
    $stored = $existing->fetch(PDO::FETCH_ASSOC) ?: null;

    $user = rs_resolve_membership_user(
        $pdo,
        $metadataUserId ?: (int)($stored['user_id'] ?? 0),
        $metadataEmail ?: (string)($stored['email'] ?? ''),
        $checkoutMetadata !== null
    );
    if (!$user) {
        throw new RuntimeException('Could not resolve membership user for Stripe subscription.');
    }

    $item = $subscription->items->data[0] ?? null;
    $priceId = (string)($item->price->id ?? '');
    [$periodStart, $periodEnd] = rs_stripe_subscription_period($subscription, $item);
    $plan = $metadataPlan ?: (string)($stored['plan'] ?? '');
    if (!in_array($plan, ['pro_monthly', 'pro_yearly', 'vip_monthly', 'vip_yearly'], true)) {
        throw new RuntimeException('Unknown Stripe subscription plan.');
    }

    $stmt = $pdo->prepare(
        "INSERT INTO chordlink_subscriptions
          (user_id, provider, provider_customer_id, provider_subscription_id,
           provider_price_id, plan, status, current_period_start,
           current_period_end, cancel_at_period_end)
         VALUES (?, 'stripe', ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           user_id = VALUES(user_id), provider_customer_id = VALUES(provider_customer_id),
           provider_price_id = VALUES(provider_price_id), plan = VALUES(plan),
           status = VALUES(status), current_period_start = VALUES(current_period_start),
           current_period_end = VALUES(current_period_end),
           cancel_at_period_end = VALUES(cancel_at_period_end), updated_at = NOW()"
    );
    $stmt->execute([
        (int)$user['id'], (string)($subscription->customer ?? ''), $subscriptionId,
        $priceId, $plan, rs_local_subscription_status((string)($subscription->status ?? 'expired')),
        $periodStart, $periodEnd, !empty($subscription->cancel_at_period_end) ? 1 : 0,
    ]);

    $customerId = (string)($subscription->customer ?? '');
    if ($customerId !== '') {
        $customer = $pdo->prepare(
            'UPDATE ' . USER_TABLE . ' SET stripe_customer_id = ?
              WHERE id = ? AND (stripe_customer_id IS NULL OR stripe_customer_id = ?)'
        );
        $customer->execute([$customerId, (int)$user['id'], $customerId]);
    }

    if (!empty($user['new'])) {
        rs_issue_password_setup_email((string)$user['email'], (int)$user['id']);
    }
    $role = sync_user_role_from_subscriptions($pdo, (int)$user['id']);
    $drupalStatus = 'unavailable';
    try {
        $drupalStatus = rs_notify_drupal_vip_grant(
            (int)$user['id'],
            has_active_vip_subscription($pdo, (int)$user['id'])
        );
    }
    catch (Throwable $exception) {
        error_log('Non-fatal Drupal VIP synchronization error: ' . $exception->getMessage());
    }

    return [
        'user_id' => (int)$user['id'],
        'email' => (string)$user['email'],
        'role' => $role,
        'new' => !empty($user['new']),
        'drupal_status' => $drupalStatus,
    ];
}
