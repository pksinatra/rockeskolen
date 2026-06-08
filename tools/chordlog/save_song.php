<?php
require $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';

$user = current_user();

if (!$user) {
    echo json_encode([]);
    exit;
}

$userId = $user['id'];

// session_start();
// $userId = $_SESSION['user_id'] ?? 0;

$userLevel = "free";

if($isVip){
    $userLevel = "vip";
}

$limits = [
    "free" => [
        "max_songs" => 5
    ],
    "vip" => [
        "max_songs" => 999999
    ]
];


$title = trim($_POST["title"] ?? "");
$tempo = intval($_POST["tempo"] ?? 120);
$sig   = $_POST["timeSignature"] ?? "4/4";
$key   = trim($_POST["key"] ?? "");

$songId = isset($_POST["song_id"]) && $_POST["song_id"] !== ""
    ? intval($_POST["song_id"])
    : null;

$total_takter = intval($_POST["total_takter"] ?? 4);

if ($title === "") {
    echo json_encode(["success"=>false,"error"=>"Title required"]);
    exit;
}

try {

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->beginTransaction();


$limit_free = 5;

if(!$isVip){

    $stmt = $pdo->prepare("
        SELECT COUNT(*) 
        FROM chordapp_songs 
        WHERE user_id = ?
    ");

    $stmt->execute([$userId]);

    $songCount = $stmt->fetchColumn();

    if($songCount >= $limit_free && !$songId){
        echo json_encode([
            "success"=>false,
            "error"=>"Free-brukere kan lagre maks $limit_free låter."
        ]);
        exit;
    }
}

$maxSongs = $limits[$userLevel]["max_songs"];

$stmt = $pdo->prepare("
SELECT COUNT(*) 
FROM chordapp_songs 
WHERE user_id = ?
");

$stmt->execute([$userId]);

$songCount = $stmt->fetchColumn();

if($songCount >= $maxSongs && !$songId){

    echo json_encode([
        "success" => false,
        "error" => "Du har nådd maks antall lagrede låter. Oppgrader til VIP for ubegrenset lagring."
    ]);

    exit;
}
    // ---------- SONG ----------
    if ($songId) {

        $stmt = $pdo->prepare("
        UPDATE chordapp_songs
        SET title=?, tempo=?, song_key=?, time_signature=?, total_takter=?
        WHERE id=?");

        $stmt->execute([$title,$tempo,$key,$sig,$total_takter,$songId]);

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

    $pdo->rollBack();

    echo json_encode([
        "success"=>false,
        "error"=>$e->getMessage()
    ]);

}
