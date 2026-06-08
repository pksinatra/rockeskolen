<?php
require $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';

$user = current_user();

if (!$user) {
    echo json_encode([]);
    exit;
}

$userId = $user['id'];



header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

try {
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  $stmt = $pdo->prepare("
    SELECT *
    FROM chordapp_songs
    WHERE user_id = ?
    ORDER BY created_at DESC
  ");

  $stmt->execute([$userId]);

  $songs = $stmt->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode($songs);

} catch (Exception $e) {

  echo json_encode(["error" => $e->getMessage()]);

}
?>
