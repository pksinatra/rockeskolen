<?php
declare(strict_types=1);

/**
 * Returns the access role represented by a subscription plan.
 */
function subscription_plan_role(string $plan): string {
    if (str_starts_with($plan, 'vip_')) {
        return 'vip';
    }
    if (str_starts_with($plan, 'pro_')) {
        return 'pro';
    }
    return 'free';
}

/**
 * Selects the strongest active subscription role.
 */
function strongest_subscription_role(array $subscriptions): string {
    $role = 'free';
    foreach ($subscriptions as $subscription) {
        if (!in_array($subscription['status'] ?? '', ['active', 'trialing'], true)) {
            continue;
        }
        $candidate = subscription_plan_role((string)($subscription['plan'] ?? ''));
        if ($candidate === 'vip') {
            return 'vip';
        }
        if ($candidate === 'pro') {
            $role = 'pro';
        }
    }
    return $role;
}

/**
 * Recalculates a user's role from all current subscriptions.
 */
function sync_user_role_from_subscriptions(PDO $pdo, int $userId): string {
    $user = $pdo->prepare('SELECT role FROM ' . USER_TABLE . ' WHERE id = ? LIMIT 1');
    $user->execute([$userId]);
    $currentRole = $user->fetchColumn();
    if ($currentRole === false) {
        throw new RuntimeException('Unknown membership user.');
    }
    if ($currentRole === 'admin') {
        return 'admin';
    }

    $stmt = $pdo->prepare(
        "SELECT plan, status
           FROM chordlink_subscriptions
          WHERE user_id = ?
            AND (
              status = 'trialing'
              OR (
                status = 'active'
                AND (current_period_end IS NULL OR current_period_end >= NOW())
              )
            )"
    );
    $stmt->execute([$userId]);
    $targetRole = strongest_subscription_role($stmt->fetchAll(PDO::FETCH_ASSOC));

    if ($targetRole !== $currentRole) {
        $update = $pdo->prepare('UPDATE ' . USER_TABLE . ' SET role = ? WHERE id = ?');
        $update->execute([$targetRole, $userId]);
    }
    return $targetRole;
}

/**
 * Returns whether a member currently has an active Stripe VIP entitlement.
 */
function has_active_vip_subscription(PDO $pdo, int $userId): bool {
    $stmt = $pdo->prepare(
        "SELECT 1 FROM chordlink_subscriptions
          WHERE user_id = ?
            AND plan IN ('vip_monthly', 'vip_yearly')
            AND status IN ('active', 'trialing')
            AND (current_period_end IS NULL OR current_period_end >= NOW())
          LIMIT 1"
    );
    $stmt->execute([$userId]);
    return (bool)$stmt->fetchColumn();
}
