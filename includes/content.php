<?php

function rs_h(?string $value): string {
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}

function rs_slugify(string $value): string {
    $value = strtolower(trim($value));
    $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) ?: $value;
    $value = preg_replace('/[^a-z0-9]+/', '-', $value);
    $value = trim($value ?? '', '-');
    return $value !== '' ? $value : 'untitled';
}

function rs_meta_from_text(?string $text): string {
    $text = trim(preg_replace('/\s+/', ' ', strip_tags($text ?? '')));
    if (mb_strlen($text) <= 155) return $text;
    return rtrim(mb_substr($text, 0, 152), " \t\n\r\0\x0B.,") . '...';
}

function rs_tools(): array {
    return [
        [
            'title' => 'Pianoakkorder',
            'slug' => 'pianoakkorder',
            'category' => 'Piano',
            'product_status' => 'Klar',
            'app_url' => '/tools/chords/piano/',
            'cta_label' => 'Åpne',
            'short_description' => 'Trykk deg rundt i akkorder på piano og keyboard uten å drukne i teori.',
            'body' => "Pianoakkorder gjør akkordteori konkret. Verktøyet viser hvordan akkorder bygges opp, hvordan de ligger på klaviaturet, og hvordan samme harmonikk kan forstås gjennom toner og intervaller.\n\nBruk det når du øver, lager beats, skriver låter eller bare vil finne ut hva som faktisk skjer i en akkord.",
            'show_on_home' => true,
            'sort_order' => 10,
        ],
        [
            'title' => 'Gitarakkorder',
            'slug' => 'gitarakkorder',
            'category' => 'Gitar',
            'product_status' => 'Klar',
            'app_url' => '/tools/chords/guitar/',
            'cta_label' => 'Åpne',
            'short_description' => 'Finn grep og akkordformer som faktisk kan brukes i låter og band.',
            'body' => "Gitarakkorder samler grep og voicinger i en form som er lett å bruke mens du spiller. Målet er å gjøre overgangen mellom teori og instrument kortere.\n\nVerktøyet bør holdes funksjonelt likt ChordLink-versjonen, med Rockeskolen-språk og presentasjon.",
            'show_on_home' => true,
            'sort_order' => 20,
        ],
        [
            'title' => 'Pianoskalaer',
            'slug' => 'pianoskalaer',
            'category' => 'Skalaer',
            'product_status' => 'Klar',
            'app_url' => '/tools/scales/piano/',
            'cta_label' => 'Åpne',
            'short_description' => 'Se skalaer på tangentene og koble teori rett til lyd.',
            'body' => "Pianoskalaer viser skalaer visuelt på tangentene. Det gjør det enklere å se mønstre, sammenligne tonearter og knytte teori til det du faktisk spiller.\n\nDette er et av kjerneverktøyene som bør speile ChordLink mest mulig direkte.",
            'show_on_home' => true,
            'sort_order' => 30,
        ],
        [
            'title' => 'Gitarskalaer',
            'slug' => 'gitarskalaer',
            'category' => 'Skalaer',
            'product_status' => 'Klar',
            'app_url' => '/tools/scales/guitar/',
            'cta_label' => 'Åpne',
            'short_description' => 'Lær skalaer som mønstre på gitarhalsen, ikke bare som ord i en bok.',
            'body' => "Gitarskalaer hjelper elever og musikere å se skalaer som mønstre på gitarhalsen. Det passer både til teknikk, improvisasjon og forståelse av tonearter.",
            'show_on_home' => true,
            'sort_order' => 40,
        ],
        [
            'title' => 'Kvintsirkelen',
            'slug' => 'kvintsirkelen',
            'category' => 'Harmonikk',
            'product_status' => 'Klar',
            'app_url' => '/tools/circles/fifths/',
            'cta_label' => 'Åpne',
            'short_description' => 'Et kart over tonearter, akkorder og hvorfor noen overganger bare funker.',
            'body' => "Kvintsirkelen er et visuelt kart over tonearter og relasjoner. Den passer godt som bro mellom teori, komposisjon og gehør.\n\nRockeskolen-versjonen bør presentere innholdet pedagogisk, mens funksjonaliteten holdes lik ChordLink.",
            'show_on_home' => true,
            'sort_order' => 50,
        ],
        [
            'title' => 'ChordLog',
            'slug' => 'chordlog',
            'category' => 'Låtskriving',
            'product_status' => 'Beta',
            'app_url' => '/tools/chordlog/',
            'cta_label' => 'Åpne',
            'short_description' => 'Fang låtidéer, akkorder og skisser før de forsvinner.',
            'body' => "ChordLog er arbeidsflaten for akkordskjemaer og låtidéer. Verktøyet bør gjennomgås ekstra nøye fordi det bruker medlemsinnlogging og database.\n\nStatus: bør sammenlignes med ChordLink før det regnes som ferdig produksjon.",
            'show_on_home' => true,
            'sort_order' => 60,
        ],
        [
            'title' => 'Tuner og stemmetoner',
            'slug' => 'tuner',
            'category' => 'Instrument',
            'product_status' => 'Klar',
            'app_url' => '/tools/tuners/',
            'cta_label' => 'Åpne',
            'short_description' => 'Stem instrumentet, finn tonen og kom i gang med spillinga.',
            'body' => "Tuner-verktøyene gir rask tilgang til referansetoner og stemming. Strukturen bør etter hvert samordnes med ChordLink, som skiller mellom enkel stemmegaffel og pro-tuner.",
            'show_on_home' => false,
            'sort_order' => 70,
        ],
        [
            'title' => 'Spillbart piano',
            'slug' => 'spillbart-piano',
            'category' => 'Instrument',
            'product_status' => 'Klar',
            'app_url' => '/tools/instruments/piano_playable.php',
            'cta_label' => 'Åpne',
            'short_description' => 'Et lite piano rett i nettleseren når du trenger å høre tonen nå.',
            'body' => "Det spillbare pianoet er et lavterskel instrumentverktøy. ChordLink bruker en annen sti for tilsvarende funksjon, så dette bør harmoniseres før større endringer.",
            'show_on_home' => false,
            'sort_order' => 80,
        ],
        [
            'title' => 'Musikksymboler',
            'slug' => 'musikksymboler',
            'category' => 'Teori',
            'product_status' => 'Beta',
            'app_url' => '/tools/symbols/',
            'cta_label' => 'Åpne',
            'short_description' => 'Symboler og begreper forklart uten å gjøre musikk vanskeligere enn den er.',
            'body' => "Musikksymboler kan bli en viktig del av instrumentleksikonet og teoridelen på Rockeskolen. Innholdet bør kvalitetssikres og kobles mot artikler etter hvert.",
            'show_on_home' => false,
            'sort_order' => 90,
        ],
    ];
}

function rs_articles(): array {
    return [
        [
            'title' => 'Fra idé til ferdig musikk',
            'slug' => 'fra-ide-til-ferdig-musikk',
            'ingress' => 'Rockeskolen skal gjøre det enklere å gå fra første idé til noe du faktisk kan spille, dele og bygge videre på.',
            'body' => "Rockeskolen handler ikke bare om å slå opp akkorder eller skalaer. Det handler om å tørre å starte, finne lyden sin og skjønne nok til å komme videre.\n\nVerktøyene under `/tools` er derfor ikke pynt rundt undervisningen. De er en del av arbeidsrommet: for øving, samspill, låtskriving, produksjon og nysgjerrighet.",
            'published_at' => '2026-06-08 12:00:00',
        ],
        [
            'title' => 'RDØ og ChordLink',
            'slug' => 'chordlink-som-betaomrade',
            'ingress' => 'Rockeskolens Digitale Øvingsrom er læringsplattformen. ChordLink er testbenken for nye musikkverktøy.',
            'body' => "Rockeskolens Digitale Øvingsrom bygges som en nettbasert plattform med instrumentleksikon, musikkteori, interaktive verktøy, øvingsressurser og digitale møteplasser.\n\nChordLink fungerer som utviklingsplattform. Når et verktøy er stabilt, kan det publiseres på Rockeskolen med norsk språk, Rockeskolen-presentasjon og samme funksjonalitet.",
            'published_at' => '2026-06-08 12:10:00',
        ],
    ];
}

function rs_portal_sections(): array {
    return [
        [
            'title' => 'Skolebenken',
            'eyebrow' => 'Musikkteori',
            'url' => 'https://portal.rockeskolen.com/musikkteori',
            'summary' => 'Begreper, byggesteiner og forklaringer som gjør musikk lettere å bruke i praksis.',
            'items' => [
                ['title' => 'Noter', 'summary' => 'Hvordan musikk skrives og måles i tid.', 'url' => 'https://portal.rockeskolen.com/taxonomy/term/34'],
                ['title' => 'Skalaer', 'summary' => 'Byggesteinene i all musikk.', 'url' => 'https://portal.rockeskolen.com/taxonomy/term/35'],
                ['title' => 'Intervaller', 'summary' => 'Avstanden mellom toner, og nøkkelen til klang og uttrykk.', 'url' => 'https://portal.rockeskolen.com/taxonomy/term/36'],
                ['title' => 'Akkorder og harmoni', 'summary' => 'Musikkens stemning, farge og fundament.', 'url' => 'https://portal.rockeskolen.com/taxonomy/term/37'],
            ],
        ],
        [
            'title' => 'Komponister',
            'eyebrow' => 'Musikkhistorie',
            'url' => 'https://portal.rockeskolen.com/komponister',
            'summary' => 'Fra gregoriansk sang og barokk til elektronisk lyd, minimalisme og moderne klangverden.',
            'items' => [
                ['title' => 'Johann Sebastian Bach', 'summary' => 'Teknisk kompleksitet, dyp uttrykkskraft og enorm betydning for musikkteori.', 'url' => 'https://portal.rockeskolen.com/node/190'],
                ['title' => 'Antonio Vivaldi', 'summary' => 'Barokk energi, solokonserter og De fire årstider.', 'url' => 'https://portal.rockeskolen.com/node/189'],
                ['title' => 'Karlheinz Stockhausen', 'summary' => 'Elektronisk lyd, rom, struktur og radikal nytenkning.', 'url' => 'https://portal.rockeskolen.com/node/207'],
                ['title' => 'John Cage', 'summary' => 'Stillhet, tilfeldighet og hverdagslyder som musikalske elementer.', 'url' => 'https://portal.rockeskolen.com/node/206'],
            ],
        ],
        [
            'title' => 'Instrumenter',
            'eyebrow' => 'Instrumentleksikon',
            'url' => 'https://portal.rockeskolen.com/instrumenter',
            'summary' => 'Et bredt instrumentunivers fra gitar, piano og slagverk til digitale og eksperimentelle instrumenter.',
            'items' => [
                ['title' => 'Elektroniske og digitale instrumenter', 'summary' => 'Synthesizere, samplere, DAW-er, MIDI-kontrollere og trommemaskiner.', 'url' => 'https://portal.rockeskolen.com/taxonomy/term/47'],
                ['title' => 'Klimpreinstrumenter', 'summary' => 'Strengeinstrumenter som gitar og bass.', 'url' => 'https://portal.rockeskolen.com/taxonomy/term/48'],
                ['title' => 'Slagverk og perkusjon', 'summary' => 'Trommesett, marimba, perkusjon og rytmiske instrumenter.', 'url' => 'https://portal.rockeskolen.com/taxonomy/term/52'],
                ['title' => 'Vokal', 'summary' => 'Sang, vokaleffekter, beatboxing og vokal prosessering.', 'url' => 'https://portal.rockeskolen.com/taxonomy/term/51'],
            ],
        ],
    ];
}

function rs_public_tools(?int $limit = null, bool $homeOnly = false): array {
    $tools = array_values(array_filter(rs_tools(), static fn($tool) => !$homeOnly || !empty($tool['show_on_home'])));
    usort($tools, static fn($a, $b) => ($a['sort_order'] ?? 100) <=> ($b['sort_order'] ?? 100));
    return $limit === null ? $tools : array_slice($tools, 0, max(1, $limit));
}

function rs_tool_by_slug(string $slug): ?array {
    $slug = rs_slugify($slug);
    foreach (rs_tools() as $tool) {
        if ($tool['slug'] === $slug) return $tool;
    }
    return null;
}

function rs_article_by_slug(string $slug): ?array {
    $slug = rs_slugify($slug);
    foreach (rs_articles() as $article) {
        if ($article['slug'] === $slug) return $article;
    }
    return null;
}

function rs_render_rich_text(?string $body): void {
    $body = trim($body ?? '');
    if ($body === '') return;

    foreach (preg_split('/\R{2,}/', $body) as $block) {
        $block = trim($block);
        if ($block === '') continue;

        if (preg_match('/^[-*]\s+/m', $block)) {
            echo '<ul>';
            foreach (preg_split('/\R/', $block) as $line) {
                $line = preg_replace('/^[-*]\s+/', '', trim($line));
                if ($line !== '') echo '<li>' . rs_h($line) . '</li>';
            }
            echo '</ul>';
            continue;
        }

        echo '<p>' . nl2br(rs_h($block), false) . '</p>';
    }
}
