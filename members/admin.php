<?php
require $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';

$u = current_user();
 if ($u['role'] !== 'admin') {
    die("No access");
 }

$stmt = $pdo->query("
  SELECT id, email, role, created_at
  FROM " . USER_TABLE . "
  ORDER BY id DESC
");

$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<!doctype html>
<html>
<head>
<link rel="stylesheet" href="/members/members.css">
</head>
<body>

<div class="wrap">
  <div class="card">
    <h1>Medlemmer</h1>

    <table style="width:100%; margin-top:14px;">
      <tr>
        <th>ID</th>
        <th>Email</th>
        <th>Role</th>
      </tr>

      <?php foreach ($users as $u): ?>
      <tr>
        <td><?= $u['id'] ?></td>
        <td><?= htmlspecialchars($u['email']) ?></td>
        <td><?= $u['role'] ?></td><td>
          <form method="post" action="/members/cancel_subscription.php" style="display:inline;">
  <input type="hidden" name="user_id" value="<?= $u['id'] ?>">
  <button type="submit">Avslutt abo</button>
</form>
</td>
      </tr>
      <?php endforeach; ?>
    </table>

  </div>
</div>

</body>
</html>