<?php
require $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';

$user = current_user();
header('Content-Type: application/json');

if (!$user) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Logg inn for å lagre låter."]);
    exit;
}

$userId = $user['id'];

$title = trim($_POST["title"] ?? "");
$tempo = intval($_POST["tempo"] ?? 120);
$sig   = $_POST["timeSignature"] ?? "4/4";
$key   = trim($_POST["key"] ?? "");

$songId = isset($_POST["song_id"]) && $_POST["song_id"] !== ""
    ? intval($_POST["song_id"])
    : null;

$total_takter = intval($_POST["total_takter"] ?? 4);

if ($title === "") {
    echo json_encode(["success"=>false,"error"=>"Tittel mangler"]);
    exit;
}

try {
    $pdo->beginTransaction();

    if ($songId) {
        $stmt = $pdo->prepare("
            SELECT id
            FROM chordapp_songs
            WHERE id = ? AND user_id = ?
            LIMIT 1
        ");
        $stmt->execute([$songId, $userId]);

        if (!$stmt->fetchColumn()) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "Fant ikke låten."]);
            exit;
        }
    }

$stmt = $pdo->prepare("
SELECT COUNT(*) 
FROM chordapp_songs 
WHERE user_id = ?
");

$stmt->execute([$userId]);

$songCount = $stmt->fetchColumn();

if(!has_rockeskolen_access($user) && $songCount >= 5 && !$songId){

    $pdo->rollBack();
    echo json_encode([
        "success" => false,
        "error" => "Free-brukere kan lagre maks 5 låter. Oppgrader til VIP for ubegrenset lagring."
    ]);

    exit;
}

    // ---------- SONG ----------
    if ($songId) {

        $stmt = $pdo->prepare("
        UPDATE chordapp_songs
        SET title=?, tempo=?, song_key=?, time_signature=?, total_takter=?
        WHERE id=? AND user_id=?");

        $stmt->execute([$title,$tempo,$key,$sig,$total_takter,$songId,$userId]);

        $pdo->prepare("DELETE FROM chordapp_chords WHERE song_id=?")
            ->execute([$songId]);

    } else {

$stmt = $pdo->prepare("
INSERT INTO chordapp_songs
(user_id,title,tempo,song_key,time_signature,total_takter,created_at)
VALUES (?,?,?,?,?,?,NOW())
");

$stmt->execute([
$userId,
$title,
$tempo,
$key,
$sig,
$total_takter
]);

        $songId = $pdo->lastInsertId();
    }


    // ---------- CHORDS ----------
    $beats = intval(explode("/", $sig)[0]);

    $ins = $pdo->prepare("
        INSERT INTO chordapp_chords
        (song_id,takt_nr,slag_nr,chord_label,taktart,doublebar,section_label)
        VALUES (?,?,?,?,?,?,?)
    ");

    for ($t = 1; $t <= $total_takter; $t++) {

        $doublebar = intval($_POST["takt{$t}_doublebar"] ?? 0);
        $section = trim($_POST["takt{$t}_section"] ?? "");

        for ($s = 1; $s <= $beats; $s++) {

            $label = trim($_POST["takt{$t}_slag{$s}"] ?? "");

            // lagre hvis akkord ELLER dobbelstrek
            if ($label !== "" || $doublebar == 1) {

$ins->execute([
    $songId,
    $t,
    $s,
    $label,
    $sig,
    $doublebar,
    $s == 1 ? $section : ""
]);
            }

        }

    }

    $pdo->commit();

    echo json_encode([
        "success"=>true,
        "song_id"=>$songId
    ]);

} catch (Exception $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    echo json_encode([
        "success"=>false,
        "error"=>$e->getMessage()
    ]);

}
