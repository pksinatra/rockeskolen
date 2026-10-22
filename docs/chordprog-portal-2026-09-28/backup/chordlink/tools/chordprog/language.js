(function(global){
  "use strict";
  const exact = {
    "Minor blues":"Moll-bluesskala", "Major blues":"Dur-bluesskala",
    "Suggested melody scale:":"Foreslått melodiskala:", "Musical melody choices":"Musikalske melodivalg",
    "Full chord-tone coverage":"Alle akkordtoner i skalaen", "Other harmonic matches":"Andre harmoniske treff",
    "All chord tones are contained in this scale.":"Alle akkordtonene finnes i denne skalaen.",
    "Some chord tones are outside this scale. This measures harmonic coverage, not whether the scale is a useful melody choice.":"Noen akkordtoner ligger utenfor skalaen. Dette måler harmonisk samsvar, ikke om skalaen er et godt melodivalg.",
    "Minor blues and minor pentatonic are traditional melody choices over dominant blues chords. Their minor third creates expressive tension against the major third in the chords. Major blues and major pentatonic offer a brighter alternative. These are melodic palettes, not scales containing every chord tone; follow the changing chords with your ear.":"Moll-bluesskalaen og mollpentatonisk er tradisjonelle melodivalg over bluesens dominantakkorder. Molltersen gir uttrykksfull spenning mot akkordenes durters. Dur-bluesskalaen og durpentatonisk gir et lysere alternativ. Dette er melodiske paletter, ikke skalaer som inneholder alle akkordtonene; følg akkordskiftene med øret.",
    "by ChordLink":"fra ChordLink",
    "Find a progression. Hear it in any key. Understand why it works. Make it yours.":"Finn en akkordprogresjon. Hør den i hvilken som helst toneart. Forstå hvorfor den fungerer. Gjør den til din egen.",
    "What are you writing?":"Hva skriver du?",
    "Tell ChordProg what you need. You will get a small set of progressions you can hear immediately.":"Fortell ChordProg hva du trenger. Du får et lite utvalg akkordprogresjoner som du kan høre med en gang.",
    "SONG SECTION":"LÅTDEL", "FEEL":"STEMNING", "Anything":"Alle låtdeler",
    "Verse":"Vers", "Chorus":"Refreng", "Bridge":"Mellomspill", "Underscore":"Bakgrunnsmusikk",
    "Surprise me":"Overrask meg", "Bright":"Lys", "Dark":"Mørk", "Emotional":"Følelsesladet",
    "Driving":"Drivende", "Dreamy":"Drømmende", "Sophisticated":"Sofistikert",
    "Find progressions →":"Finn akkordprogresjoner →", "Or search the complete library":"Eller søk i hele biblioteket",
    "Name, mood or Roman numerals…":"Navn, stemning eller romertall…", "Style":"Stil", "All styles":"Alle stiler", "Any use":"Alle bruksområder",
    "Listen to a few. Open the one that makes you curious.":"Lytt til noen forslag. Åpne det som gjør deg nysgjerrig.",
    "Change key, timing and notation":"Endre toneart, rytme og notasjon", "Key (root)":"Toneart (grunntone)",
    "Notation":"Notasjon", "Auto":"Automatisk", "Time signature":"Taktart", "Subdivision (units)":"Underdeling",
    "Number of bars":"Antall takter", "Chords per bar":"Akkorder per takt",
    "Scale match = chord tones contained in scale":"Skalatreff = akkordtoner som finnes i skalaen",
    "Creative = 1 outside note":"Kreativ = én tone utenfor skalaen", "English note names (B, not H)":"Engelske tonenavn (B, ikke H)",
    "Advanced: sequence and export":"Avansert: sekvens og eksport", "Step-sequencer":"Trinnsekvenser",
    "1–4 slots. Enter progression IDs (P1 J1 …) or Roman numerals (I V vi IV). Play them in order and export JAMS + Sequence JSON.":"1–4 felt. Skriv inn progresjons-ID-er (P1 J1 …) eller romertall (I V vi IV). Spill dem i rekkefølge og eksporter JAMS + sekvens-JSON.",
    "Slot 1":"Felt 1", "Slot 2":"Felt 2", "Slot 3":"Felt 3", "Slot 4":"Felt 4", "optional":"valgfritt",
    "P1 P5 M1  |  or: I V vi IV":"P1 P5 M1  |  eller: I V vi IV", "J1  |  or: ii V I":"J1  |  eller: ii V I",
    "Step length":"Trinnlengde", "1 beat per chord (4n)":"1 slag per akkord (4n)", "2 beats per chord (2n)":"2 slag per akkord (2n)", "1 bar per chord (1n)":"1 takt per akkord (1n)",
    "Loop":"Gjenta", "Off":"Av", "On (play twice)":"På (spill to ganger)",
    "▶ Play slots":"▶ Spill feltene", "📦 Export JSON":"📦 Eksporter JSON", "🧹 Clear":"🧹 Tøm", "Export":"Eksport",
    "➕ Add selected → slot":"➕ Legg valgt → felt", "JAMS / Sequence JSON will appear here…":"JAMS / sekvens-JSON vises her…",
    "bold":"kraftfull", "natural":"naturlig", "intimate":"intim", "meditative":"meditativ",
    "Storytelling":"Historiefortelling", "Acoustic song":"Akustisk låt", "Solo section":"Soloparti", "Jazz/R&B section":"Jazz-/R&B-parti",
    "Dramatic section":"Dramatisk parti", "Ambient bed":"Ambient bakgrunn",
    "Sound":"Lyd", "Pad":"Klangflate", "Pluck":"Klimprelyd", "🔈 Enable sound":"🔈 Aktiver lyd", "✅ Sound enabled":"✅ Lyd aktivert",
    "Playback tempo":"Avspillingstempo", "Drag to choose the pace. All progression and variant playback uses this tempo.":"Dra for å velge tempo. Alle progresjoner og varianter spilles i dette tempoet.",
    "▶ Play selected":"▶ Spill valgt", "🎲 Random":"🎲 Tilfeldig", "Hear, understand and explore":"Hør, forstå og utforsk",
    "Choose a progression on the left.":"Velg en akkordprogresjon til venstre.", "Feel":"Stemning", "Works well for":"Passer til",
    "Try it — choose and hear":"Prøv — velg og lytt", "WHY IT WORKS":"HVORFOR DET FUNGERER", "TRY THIS":"PRØV DETTE",
    "▶ Hear this progression":"▶ Hør progresjonen", "Change key":"Endre toneart", "Shape it":"Form den", "CHOOSE KEY":"VELG TONEART",
    "— the progression and melody guidance update immediately.":"— progresjonen og melodiforslagene oppdateres med en gang.",
    "Key":"Toneart", "Chords (in order)":"Akkorder (i rekkefølge)",
    "SHAPE IT — hear how one musical choice changes the feeling":"FORM DEN — hør hvordan ett musikalsk valg endrer stemningen",
    "Make it bittersweet":"Gjør den bittersøt", "Shift the perspective":"Skift perspektiv", "Add colour":"Legg til farge", "Open the ending":"Åpne avslutningen", "Build more tension":"Bygg mer spenning",
    "A minor iv at the end adds a darker pull back home.":"En iv-akkord i moll til slutt gir en mørkere vei tilbake til grunntonen.",
    "Starting on the minor chord keeps the same harmony but changes the emotional centre.":"Å starte på mollakkorden beholder harmonien, men endrer det følelsesmessige tyngdepunktet.",
    "Sevenths soften the edges and create smoother voice leading.":"Septimer myker opp klangen og gir jevnere stemmeføring.",
    "Ending on IV avoids a full stop and gives the loop a wider, more open return.":"Å avslutte på IV unngår et fullstendig punktum og gir en mer åpen vei tilbake.",
    "Ending on V makes the repeat feel more urgent and directional.":"Å avslutte på V gir gjentakelsen mer driv og retning.",
    "▶ Hear variant":"▶ Hør varianten", "Write a melody over it":"Skriv en melodi over den",
    "Your safest shared note pool is":"Det tryggeste felles toneutvalget er", "Show written scale for":"Vis skalaen skrevet for",
    "C — Concert pitch / flute":"C — Klingende tonehøyde / fløyte", "B♭ — Trumpet / clarinet":"B♭ — Trompet / klarinett", "E♭ — Alto sax":"E♭ — Altsaksofon", "F — Horn":"F — Horn",
    "Concert pitch. Accidentals are shown on each note.":"Klingende tonehøyde. Fortegn vises ved hver note.",
    "Written for B♭ instrument. The progression and playback stay in concert pitch.":"Skrevet for B♭-instrument. Progresjonen og avspillingen beholder klingende tonehøyde.",
    "Written for E♭ instrument. The progression and playback stay in concert pitch.":"Skrevet for E♭-instrument. Progresjonen og avspillingen beholder klingende tonehøyde.",
    "Written for F instrument. The progression and playback stay in concert pitch.":"Skrevet for F-instrument. Progresjonen og avspillingen beholder klingende tonehøyde.",
    "SongV1 copied ✅":"SongV1 kopiert ✅", "Automatic copy failed — please copy it manually.":"Automatisk kopiering mislyktes — kopier manuelt.",
    "No events found. Fill at least one slot (for example P1 or Roman numerals: I V vi IV).":"Ingen akkorder funnet. Fyll ut minst ett felt (for eksempel P1 eller romertall: I V vi IV).",
    "Suggested melody scale in staff notation":"Foreslått melodiskala på noter",
    "Notation could not load. The scale notes above are still available.":"Notevisningen kunne ikke lastes. Tonenavnene ovenfor er fortsatt tilgjengelige.",
    "Notation is unavailable for this scale. Use the note names above.":"Notevisningen er ikke tilgjengelig for denne skalaen. Bruk tonenavnene ovenfor.",
    "Start by aiming for the chord roots as the harmony changes:":"Begynn med å sikte mot akkordenes grunntoner når harmonien endrer seg:",
    ". Use the other notes to connect them.":". Bruk de andre tonene til å binde dem sammen.",
    "Progression":"Akkordprogresjon", "Focus scale":"Valgt skala", "What is happening theoretically?":"Hva skjer musikkteoretisk?",
    "What can you do as a musician?":"Hva kan du gjøre som musiker?", "Play the chords and improvise with":"Spill akkordene og improviser med",
    ". Try resolving to":". Prøv å lande på", "as home, while noticing whether your ear is drawn towards another chord as the tonal centre.":"som grunntone, og legg merke til om øret trekkes mot en annen akkord som tonalt sentrum.",
    "Explore matching scales and chord tones":"Utforsk passende skalaer og akkordtoner", "Recommended (diatonic)":"Anbefalt (diatonisk)", "Creative (1 outside note)":"Kreativ (én tone utenfor)",
    "No perfect match among the top results. See the creative options.":"Ingen fullstendige treff blant de beste resultatene. Se de kreative alternativene.",
    "No one-note-outside matches among the top results.":"Ingen av de beste treffene har nøyaktig én tone utenfor skalaen.",
    "Scale tones vs chord tones":"Skalatoner og akkordtoner", "Scale tones:":"Skalatoner:", "Chord tones:":"Akkordtoner:",
    "(red pills = outside the focus scale)":"(røde merker = utenfor den valgte skalaen)", "Chords and chord tones":"Akkorder og akkordtoner",
    "Roman":"Romertall", "Chord":"Akkord", "Chord tones":"Akkordtoner", "▶ Play":"▶ Spill", "➜ Open":"➜ Åpne", "📋 Copy SongV1":"📋 Kopier SongV1",
    "SongV1 (zero-based, song-level time signature/subdivision)":"SongV1 (nullbasert, taktart og underdeling på låtnivå)",
    "This prototype stores each chord as":"Denne prototypen lagrer hver akkord som", "rather than parsing a chord-name string.":"i stedet for å tolke en tekststreng med akkordnavn.",
    "Diatonic":"Diatonisk", "The scale match is":"Skalatreffet er", "In practical terms,":"I praksis betyr dette at",
    "the chord tones in the progression sit almost entirely inside this scale":"akkordtonene i progresjonen nesten alle finnes i denne skalaen",
    "This gives you a dependable pool of melody notes.":"Dette gir deg et pålitelig utvalg meloditoner.", "degrees:":"skalatrinn:", "interpretation:":"tolkning:",
    "minor centre":"mollsentrum", "major centre":"dursentrum",
    "Major":"Dur", "Natural minor":"Naturlig moll", "Harmonic minor":"Harmonisk moll", "Melodic minor (ascending)":"Melodisk moll (oppadgående)",
    "Dorian":"Dorisk", "Phrygian":"Frygisk", "Lydian":"Lydisk", "Mixolydian":"Miksolydisk", "Locrian":"Lokrisk",
    "Major pentatonic":"Durpentatonisk", "Minor pentatonic":"Mollpentatonisk", "Blues pentatonic":"Bluespentatonisk",
    "Half–whole diminished":"Halv–hel diminuert", "Whole–half diminished":"Hel–halv diminuert", "Whole tone":"Heltoneskala",
    "Lydian dominant":"Lydisk dominant", "Super Locrian (altered)":"Superlokrisk (alterert)", "Romanian minor":"Rumensk moll",
    "Phrygian dominant":"Frygisk dominant", "Double harmonic major":"Dobbel harmonisk dur", "Enigmatic":"Enigmatisk",
    "Essential & Popular":"Vanlige og populære", "Rock & Alternative":"Rock og alternativ", "Ambient & Electronic":"Ambient og elektronisk", "Cinematic":"Filmatisk",
    "Singer-Songwriter & Folk":"Viser og folk", "Songwriter Wildcards":"Uventede låtskriverideer", "Soul, R&B & Neo-Soul":"Soul, R&B og neo-soul",
    "No results for this search or style":"Ingen treff for dette søket eller denne stilen",
    "Clear the search or choose All styles. Your other choices can stay.":"Tøm søket eller velg Alle stiler. De andre valgene dine kan beholdes.",
    "Using the compact built-in library; the full library could not be loaded.":"Viser det lille, innebygde biblioteket. Hele biblioteket kunne ikke lastes.",
    "This is close to the definition of Mixolydian rock: the flat seventh is its signature.":"Dette er typisk miksolydisk rock: det senkede sjuende trinnet er kjennetegnet.",
    "Dorian creates a brighter minor sound because scale degree 6 is natural rather than flat.":"Dorisk gir en lysere mollklang fordi det sjette skalatrinnet ikke er senket.",
    "The altered scale on V creates maximum tension before resolving to I.":"Den altererte skalaen på V gir maksimal spenning før oppløsningen til I.",
    "Phrygian contains a flat second, which creates its dark, heavy character.":"Frygisk har et senket andre trinn som gir skalaen dens mørke, tunge karakter."
  };
  const phrases = {
    "Chord-tone coverage:":"Andel akkordtoner i skalaen:",
    "sits naturally inside the minor-mode palette, giving the progression breadth without requiring a leading-tone cadence":"passer naturlig i mollpaletten og gir progresjonen bredde uten å kreve en ledetonekadens",
    "in root position, then choose inversions for the middle chords that minimize upper-voice movement":"i grunnstilling, og velg omvendinger for akkordene i midten som gir minst mulig bevegelse i overstemmene",
    "as the answer; change only the dynamics between the two halves":"som svaret; endre bare dynamikken mellom de to halvdelene",
    "The middle of the phrase adds":"Midten av frasen tilfører", "before the final chord":"før den siste akkorden",
    "tonic-family colour":"tonikabeslektet klang", "chromatic dominant-quality colour":"kromatisk dominantklang", "predominant colour":"forberedende dominantklang",
    "dominant tension":"dominantspenning", "modal colour":"modal klang", "tonic":"tonika",
    "establishes":"etablerer", "and the move to":"og overgangen til", "introduces":"tilfører",
    "The move from":"Overgangen fra", "back to":"tilbake til", "creates a plagal-style return":"gir en plagal tilbakevending",
    "creates unresolved dominant energy that propels the repeat":"gir uforløst dominantspenning som driver gjentakelsen videre",
    "creates a direct dominant-to-tonic return":"gir en direkte tilbakevending fra dominant til tonika",
    "creates an open loop seam rather than a full cadence":"gir en åpen overgang i gjentakelsen fremfor en fullstendig kadens",
    "creates a clear return to the tonal centre":"gir en tydelig tilbakevending til det tonale sentrum",
    "creates a confirmed tonic arrival before the progression repeats":"gir en tydelig landing på tonika før progresjonen gjentas",
    "creates a stable repeated harmony at the loop boundary":"gir en stabil, gjentatt harmoni i overgangen mellom rundene",
    "keeps some forward pull in the loop before it returns to":"beholder fremdrift i runden før den vender tilbake til", "Ending on":"Å avslutte på",
    "Write one sustained melody note across":"Skriv én utholdt meloditone over", ", then use stepwise motion over":", og bruk deretter trinnvis bevegelse over",
    "Write a short melody that lands on a chord tone over":"Skriv en kort melodi som lander på en akkordtone over", ", leaving the middle changes less resolved":", og la akkordskiftene i midten være mindre avklart",
    "as a question and":"som et spørsmål og", "Treat":"Bruk", "Keep":"Behold", "Give":"Gi", "two bars and":"to takter og",
    "one bar each; on the repeat, give the extra bar to":"én takt hver; ved gjentakelsen gir du den ekstra takten til", "instead":"i stedet",
    "On the final pass, listen specifically to":"Ved siste gjennomspilling, lytt spesielt til",
    "at one bar each, then compress the remaining changes into half-bars before the repeat":"én takt hver, og press deretter de resterende akkordskiftene inn i halve takter før gjentakelsen",
    "The return to the tonic gives the phrase a clear sense of arrival":"Tilbakevendingen til tonika gir frasen en tydelig følelse av å lande",
    "modal or borrowed colour against the major-key centre":"modal eller lånt klang mot toneartens dursentrum",
    "Add an extra beat to":"Legg til et ekstra slag på", "before returning to":"før tilbakevendingen til", "; this makes the loop seam easier to hear":"; dette gjør overgangen mellom rundene lettere å høre",
    "The adjacent":"Det tilstøtende", "pair creates a clear predominant-to-dominant motion":"paret gir en tydelig bevegelse fra dominantforberedelse til dominant",
    "acts as an applied dominant because it resolves directly to":"fungerer som en bidominant fordi den løser seg direkte til",
    "Change only the inversion of":"Endre bare omvendingen av", "on the second pass and listen to how its modal colour shifts":"ved andre gjennomspilling, og lytt til hvordan den modale klangen endres",
    "Dominant-seventh colour on structurally stable chords supplies the characteristic blues tension":"Dominantseptimklang på strukturelt stabile akkorder gir den karakteristiske bluesspenningen",
    "The tonic returns at the end, while its added colour keeps the sound open enough to continue":"Tonika kommer tilbake til slutt, mens den ekstra klangfargen holder uttrykket åpent nok til å fortsette",
    "adds dominant-quality chromatic colour here without making a textbook resolution to its usual target":"gir kromatisk dominantklang her uten en lærebokmessig oppløsning til det vanlige målet",
    "the smoothest possible common tone from":"den jevnest mulige fellestonen fra", "into":"inn i", ", then allow a wider melodic move":", og tillat deretter et større melodisk sprang",
    "The half-diminished":"Den halvforminskede", "moving directly to":"som går direkte til", "gives the minor key a strong predominant-to-dominant pull":"gir molltonearten en sterk bevegelse fra dominantforberedelse til dominant",
    "The final dominant-to-tonic move gives the phrase a clear point of arrival":"Den siste bevegelsen fra dominant til tonika gir frasen et tydelig landingspunkt",
    "Build toward":"Bygg mot", "dynamically, then repeat with":"med dynamikken, og gjenta deretter med", "as the strongest chord instead":"som den sterkeste akkorden i stedet",
    "adds chromatic tension and can connect its neighbouring chords with very small voice-leading moves":"gir kromatisk spenning og kan binde sammen naboakkordene med svært små bevegelser i stemmeføringen",
    "Voice":"Legg stemmene i", "so each part moves by the smallest possible interval into the following chord":"slik at hver stemme går med minst mulig intervall til den neste akkorden",
    "Carry a common top note into":"Behold en felles topptone inn i", "to make the colour change smoother and more vocal":"for å gjøre klangskiftet jevnere og mer sangbart",
    "briefly points toward the relative minor and adds a focused secondary-dominant pull":"peker kort mot parallellmoll og gir et tydelig bidominantdrag",
    "Anticipate the relative minor with one melody note over":"Foregrip parallellmoll med én meloditone over", ", then repeat without the anticipation and compare the pull":", og gjenta deretter uten denne foregripelsen for å sammenligne draget",
    "begins a predominant span that expands through":"starter et dominantforberedende forløp som utvides gjennom", "before":"før", "arrives":"ankommer",
    "The contrast between":"Kontrasten mellom", "puts the focus on voicing, rhythm and common tones rather than harmonic complexity":"retter oppmerksomheten mot akkordlegging, rytme og fellestoner fremfor harmonisk kompleksitet",
    "Because the harmony changes slowly, common tones and sustained upper voices can become part of the progression's identity":"Fordi harmonien skifter langsomt, kan fellestoner og utholdte overstemmer bli en del av progresjonens identitet",
    "Let":"La", "last two bars each, then halve both durations and compare how the same two chords change character":"vare to takter hver, og halver deretter begge varighetene for å sammenligne hvordan de samme akkordene endrer karakter",
    "one common upper note, where possible, while alternating":"én felles topptone der det er mulig, mens du veksler mellom", "; free the top voice on the second pass":"; slipp toppstemmen fri ved andre gjennomspilling",
    "three beats and":"tre slag og", "one beat, then reverse the pattern without changing tempo":"ett slag, og snu deretter mønsteret uten å endre tempo",
    "Make":"Gjør", "twice as long as":"dobbelt så lang som", ", then reverse the weighting and compare the harmonic centre of gravity":", og snu deretter vektingen for å sammenligne det harmoniske tyngdepunktet",
    "Try resolving to":"Prøv å lande på", "Play at":"Spill i",
    "Written notes:":"Skrevne toner:", "Written for":"Skrevet for", "instrument. The progression and playback stay in concert pitch.":"-instrument. Progresjonen og avspillingen beholder klingende tonehøyde.",
    "Good for":"Passer til", "Songwriting":"Låtskriving", "Rock section":"Rockparti", "Film cue":"Filmscene", "Slow build":"Langsom oppbygging", "Turnaround":"Vending", "Blues song":"Blueslåt", "Jam":"Jam", "Intro":"Intro", "Outro":"Avslutning", "Loop / vamp":"Gjentakelse / vamp",
    "No exact combination —":"Ingen nøyaktig kombinasjon —", "nearby ideas. Feel and song-section tags are suggestions, not rules; your style and search are kept.":"nærliggende ideer. Stemning og låtdel er forslag, ikke regler; stil og søk beholdes.",
    "No results for this search or style. Clear the search or choose All styles.":"Ingen treff for dette søket eller denne stilen. Tøm søket eller velg Alle stiler.",
    "matching progressions":"passende akkordprogresjoner", "Show all":"Vis alle", "results":"resultater", "PROGRESSION":"PROGRESJON",
    "C Major":"C Dur", "Natural minor":"Naturlig moll", "Harmonic minor":"Harmonisk moll", "Melodic minor (ascending)":"Melodisk moll (oppadgående)",
    "center=minor":"sentrum=moll", "center=major":"sentrum=dur", "group:":"gruppe:", "degrees:":"skalatrinn:", "Use scale":"Bruk skalaen", "Explain":"Forklar", "Outside (":"Utenfor (",
    "bright":"lys", "familiar":"velkjent", "uplifting":"oppløftende", "dark":"mørk", "driving":"drivende", "intense":"intens", "emotional":"følelsesladet", "open":"åpen", "reflective":"ettertenksom", "dreamy":"drømmende", "sophisticated":"sofistikert", "smooth":"myk", "flowing":"flytende", "moody":"stemningsfull", "expressive":"uttrykksfull", "dramatic":"dramatisk", "expansive":"vid", "earthy":"jordnær", "airy":"luftig", "gentle":"mild", "warm":"varm", "cinematic":"filmatisk", "spacious":"romslig", "floating":"svevende", "restless":"rastløs", "playful":"leken", "mysterious":"mystisk", "and":"og"
  };
  const entries = Object.entries({...exact,...phrases}).sort((a,b)=>b[0].length-a[0].length);
  // A single pass prevents translated Norwegian words being translated again.
  const escape = s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const pattern = new RegExp(entries.map(([en])=>
    (/^\p{L}/u.test(en) ? "(?<![\\p{L}])" : "") + escape(en) +
    (/\p{L}$/u.test(en) ? "(?![\\p{L}])" : "")
  ).join("|"),"gu");
  const dictionary = new Map(entries);
  let language = "en";
  try{ language = localStorage.getItem("chordprog-language") === "nb" ? "nb" : "en"; }catch(e){}
  const originals = new WeakMap();
  const attrs = new WeakMap();
  const translate = text=>language === "nb" ? (exact[text.trim()] ? text.replace(text.trim(),exact[text.trim()]) : text.replace(pattern,match=>dictionary.get(match))) : text;
  const observer = new MutationObserver(apply);

  function apply(){
    observer.disconnect();
    document.documentElement.lang = language;
    document.title = language === "nb" ? "ChordProg – 250 akkordprogresjoner | ChordLink" : "ChordProg – 250 Chord Progressions | ChordLink";
    const walker = document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if(node.parentElement.closest("script,style,textarea,svg,#languageToggle,[data-no-translate],.item .name,.companion h3")) continue;
      // Keep option values in English: filters depend on library metadata.
      if(node.parentElement.tagName === "OPTION" && !node.parentElement.hasAttribute("value")){
        node.parentElement.setAttribute("value",node.parentElement.textContent);
      }
      const saved = originals.get(node);
      const source = saved && node.nodeValue === saved.display ? saved.source : node.nodeValue;
      const display = translate(source);
      originals.set(node,{source,display});
      if(node.nodeValue !== display) node.nodeValue = display;
    }
    document.querySelectorAll("[placeholder],[aria-label],[title]").forEach(el=>{
      if(el.closest("#languageToggle,svg")) return;
      let saved = attrs.get(el) || {};
      for(const name of ["placeholder","aria-label","title"]){
        if(!el.hasAttribute(name)) continue;
        const value = el.getAttribute(name);
        const previous = saved[name];
        const source = previous && value === previous.display ? previous.source : value;
        const display = translate(source);
        saved[name] = {source,display};
        if(value !== display) el.setAttribute(name,display);
      }
      attrs.set(el,saved);
    });
    const button = document.getElementById("languageToggle");
    button.setAttribute("aria-pressed",String(language === "nb"));
    button.setAttribute("aria-label",language === "nb" ? "Bytt til engelsk" : "Oversett til norsk");
    button.title = language === "nb" ? "Bytt til engelsk" : "Oversett til norsk";
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  }
  const queryToEnglish = query=>{
    if(language !== "nb") return query;
    const vocabulary = {lys:"bright",mørk:"dark",følelsesladet:"emotional",drivende:"driving",drømmende:"dreamy",sofistikert:"sophisticated",vers:"verse",refreng:"chorus",mellomspill:"bridge",låtskriving:"songwriting",filmatisk:"cinematic",ettertenksom:"reflective",myk:"smooth",åpen:"open"};
    return query.replace(/\p{L}+/gu,word=>vocabulary[word.toLowerCase()] || word);
  };
  global.CLChordProgLanguage = {translate, apply, queryToEnglish};
  document.getElementById("languageToggle").addEventListener("click",()=>{
    language = language === "nb" ? "en" : "nb";
    try{ localStorage.setItem("chordprog-language",language); }catch(e){}
    apply();
  });
  apply();
})(window);
