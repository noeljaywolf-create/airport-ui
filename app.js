/* ============================================================
   SkyPath — Airport Wayfinding Kiosk (presentation prototype)
   All data is mock/simulated for the proposal UI.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- helpers ---------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const M2F = 0.55;          // map units -> metres
  const WALK = 1.4;          // m/s

  const state = {
    view: 'home',
    level: 'L2',
    dest: null,            // selected node id
    access: false,
    voice: false,
    nav: null              // active nav overlay steps
  };

  /* ---------------- icon set (Lucide-style) ---------------- */
  const ICONS = {
    nav:     '<path d="M3 11 22 2l-9 19-2-8-8-2Z"/>',
    pin:     '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    plane:   '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    car:     '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    bus:     '<path d="M8 6v6"/><path d="M16 6v6"/><path d="M4 16h16"/><path d="M4 6c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v13a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"/><circle cx="8" cy="19" r="1"/><circle cx="16" cy="19" r="1"/>',
    train:   '<path d="M4 8a6 6 0 0 1 16 0v6H4Z"/><path d="M4 14v-2"/><path d="M20 14v-2"/><path d="m8 21 1.5-3M16 21l-1.5-3M8 6h8"/><path d="M8 10h.01M12 10h.01M16 10h.01"/>',
    walk:    '<path d="M12 3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"/><path d="m10 7 4 2 1 4 3 2-1 2-2-1-1 4"/>',
    coffee:  '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2M10 2v2M14 2v2"/>',
    food:    '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    bag:     '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    pharmacy:'<path d="M16 4h6v16h-6"/><path d="M14 9H2v6h12"/><path d="M4 2h10v20H4Z"/>',
    bank:    '<path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="m12 2 9 5H3l-9-5Z"/>',
    wc:      '<circle cx="8" cy="6" r="2.2"/><path d="M6 10h4l-1 9H7Z"/><circle cx="16" cy="6" r="2.2"/><path d="M14 10h4l-2 9h-2Z"/>',
    prayer:  '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    lounge:  '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-4h5Z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-4H3Z"/>',
    info:    '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    hotel:   '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
    luggage: '<path d="M6 8h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1Z"/><path d="M9 8V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/><path d="M9 12v5M15 12v5"/>',
    elev:    '<rect x="4" y="2" width="6" height="20" rx="1.5"/><path d="m9 7 2-3 2 3"/><path d="m9 17 2 3 2-3"/>',
    stairs:  '<path d="M13 22v-5l5-5V8h4v4h-2v4h-4v6Z"/><path d="M4 4h4v4M4 4l8 8"/>',
    ticket:  '<path d="M2 9a3 3 0 0 0 0 6v3a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-3a3 3 0 0 0 0-6V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1Z"/><path d="M13 5v2M13 11v2M13 17v2"/>',
    clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    phone:   '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
    qr:      '<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z"/><path d="M14 14h3v3h-3zM17 17h4v4h-4zM14 20v.01M20 14v.01M20 20h.01"/>',
    chat:    '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>',
    mic:     '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
    x:       '<path d="M18 6 6 18M6 6l12 12"/>',
    chevR:   '<path d="m9 18 6-6-6-6"/>',
    chevD:   '<path d="m6 9 6 6 6-6"/>',
    alert:   '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    shield:  '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    sun:     '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
    cloud:   '<path d="M17.5 19a4.5 4.5 0 1 0-.4-9A7 7 0 1 0 6.5 19Z"/>',
    rain:    '<path d="M17.5 19a4.5 4.5 0 1 0-.4-9A7 7 0 1 0 6.5 19Z"/><path d="M9 21l1.5-3M13 21l1.5-3M5 21l1.5-3"/>',
    sparkle: '<path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/>',
    dollar:  '<path d="M12 2v20"/><path d="M17 5.5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    bed:     '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
    building:'<path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"/><path d="M15 9h4a2 2 0 0 1 2 2v10"/><path d="M9 7h2M9 11h2M9 15h2"/>',
    send:    '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/>',
    scan:    '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>',
    foot:    '<path d="M4 12h4v7H4zM8 12V9h2v3h2V8h2v4h2V6h2v6"/><path d="M4 19h16"/>',
    wheel:   '<circle cx="12" cy="15" r="4.5"/><path d="M12 15V8M8 11h4a4 4 0 0 1 4 4v5l-3-2-3 2Z"/><path d="M13 8h5"/>',
    right:   '<path d="M5 12h14M12 5l7 7-7 7"/>',
    up:      '<path d="M12 19V5M5 12l7-7 7 7"/>',
    down:    '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    weather: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>'
  };
  const icon = (name, size) =>
    `<svg viewBox="0 0 24 24" width="${size || 20}" height="${size || 20}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.pin}</svg>`;

  /* ---------------- i18n ---------------- */
  const I18N = {
    en: {
      tagline: 'Harare International Airport', nav_home: 'Home', nav_map: 'Find My Way',
      nav_flights: 'Flights', nav_transport: 'Transport', nav_discover: 'Discover',
      home_eyebrow: 'Welcome to Robert Gabriel Mugabe International Airport',
      home_title: 'Where are you going?',
      home_sub: 'Search a gate, flight, facility or destination — I\u2019ll guide you there.',
      home_searchph: 'e.g. Gate B14, flight ZW123, coffee, Victoria Falls', home_go: 'Find my way',
      q1sub: 'Interactive terminal map', q2sub: 'Departures & arrivals', q3sub: 'Taxis, shuttles, trains', q4sub: 'Shops, food, lounges & more',
      gatechange: 'GATE CHANGE', navigategate: 'Navigate to B14',
      discover: 'Explore the terminal', seeall: 'See all',
      footnote: 'SkyPath is a layered wayfinding system — it supports, never replaces, airport signage and emergency procedures.',
      map_title: 'Find My Way', lvl2: 'Departures', lvl1: 'Arrivals',
      map_searchph: 'Search gate, shop, facility…', route: 'Route', dist: 'Distance', time: 'Walking time', floor: 'Floor',
      accessnote: 'Accessible route selected · lifts only, no stairs', replan: 'Replan', startnav: 'Start navigation',
      hint: 'Touch a marker to navigate', nextstep: 'Next', arrived: 'You\u2019ve arrived',
      flights_title: 'Live flight information', flights_sub: 'Real-time departures & arrivals for today',
      dep: 'Departures', arr: 'Arrivals', flights_searchph: 'Flight no. or city',
      f_time: 'Time', f_flight: 'Flight', f_to: 'To', f_from: 'From', f_gate: 'Gate', f_status: 'Status', f_bag: 'Boarding / Baggage',
      dynamic: 'Dynamic disruption handling', dynamicsub: 'ZW123\u2019s gate changed from B8 to B14. SkyPath re-routes every passenger instantly — including this one.',
      transport_title: 'Get to your destination', transport_sub: 'Airport \u2192 City & hotels — every option, one screen',
      transport_searchph: 'Hotel, suburb or attraction', desthead: 'Destination intelligence', gateway: 'Airport \u2192 Zimbabwe',
      qr_title: 'Continue on your phone', qr_sub: 'Scan to take this route with you. Turn-by-turn guidance stays in your pocket.',
      qr_steps: '1 · Open your camera · 2 · Scan the code · 3 · Follow the blue line', qr_done: 'Done', sendphone: 'Send to phone', backhome: 'Back to home',
      assist_ph: 'Ask me anything… e.g. "45 minutes before boarding?"',
      youhere: 'You are here', walk: 'Walk', along: 'along', then: 'then', turn: 'Turn',
      navstarted: 'Navigation started', to: 'to'
    },
    fr: {
      tagline: 'Aéroport international de Harare', nav_home: 'Accueil', nav_map: 'Itinéraire',
      nav_flights: 'Vols', nav_transport: 'Transport', nav_discover: 'Découvrir',
      home_eyebrow: 'Bienvenue à l\u2019aéroport international de Harare',
      home_title: 'Où allez-vous ?',
      home_sub: 'Recherchez une porte, un vol, un service ou une destination — je vous y guide.',
      home_searchph: 'ex. Porte B14, vol ZW123, café, Victoria Falls', home_go: 'Mon itinéraire',
      q1sub: 'Carte du terminal', q2sub: 'Départs & arrivées', q3sub: 'Taxis, navettes, trains', q4sub: 'Boutiques, restaurants, salons',
      gatechange: 'CHANGEMENT DE PORTE', navigategate: 'Aller à B14',
      discover: 'Découvrir le terminal', seeall: 'Tout voir',
      footnote: 'SkyPath est un système de guidage en couches — il complète, sans jamais remplacer, la signalétique et les procédures d\u2019urgence.',
      map_title: 'Mon itinéraire', lvl2: 'Départs', lvl1: 'Arrivées',
      map_searchph: 'Porte, boutique, service…', route: 'Itinéraire', dist: 'Distance', time: 'Temps de marche', floor: 'Étage',
      accessnote: 'Itinéraire accessible · ascenseurs uniquement, pas d\u2019escaliers', replan: 'Recalculer', startnav: 'Commencer',
      hint: 'Touchez un point pour naviguer', nextstep: 'Suivant', arrived: 'Vous êtes arrivé',
      flights_title: 'Informations de vol en direct', flights_sub: 'Départs et arrivées en temps réel',
      dep: 'Départs', arr: 'Arrivées', flights_searchph: 'N° de vol ou ville',
      f_time: 'Heure', f_flight: 'Vol', f_to: 'Vers', f_from: 'De', f_gate: 'Porte', f_status: 'État', f_bag: 'Embarquement / Bagages',
      dynamic: 'Gestion dynamique des perturbations', dynamicsub: 'La porte du vol ZW123 est passée de B8 à B14. SkyPath recalcule l\u2019itinéraire de chaque passager instantanément.',
      transport_title: 'Rejoignez votre destination', transport_sub: 'Aéroport \u2192 ville & hôtels — toutes les options, un seul écran',
      transport_searchph: 'Hôtel, quartier ou attraction', desthead: 'Intelligence de destination', gateway: 'Aéroport \u2192 Zimbabwe',
      qr_title: 'Continuez sur votre téléphone', qr_sub: 'Scannez pour emporter cet itinéraire avec vous.',
      qr_steps: '1 · Ouvrez la caméra · 2 · Scannez · 3 · Suivez la ligne bleue', qr_done: 'Terminé', sendphone: 'Envoyer au téléphone', backhome: 'Retour à l\u2019accueil',
      assist_ph: 'Posez-moi une question… ex. "45 minutes avant l\u2019embarquement ?"',
      youhere: 'Vous êtes ici', walk: 'Marchez', along: 'le long de', then: 'puis', turn: 'Tournez',
      navstarted: 'Navigation démarrée', to: 'vers'
    },
    zu: {
      tagline: 'Isikhumulo sezindiza iHarare', nav_home: 'Ikhaya', nav_map: 'Ngikhombise indlela',
      nav_flights: 'Izindiza', nav_transport: 'Izimoto', nav_discover: 'Thola',
      home_eyebrow: 'Siyakwamukela esikhumulweni sezindiza samazwe ngamazwe iHarare',
      home_title: 'Uya kuphi?',
      home_sub: 'Cinga isango, indiza, insiza noma indawo — ngizokuqondisa.',
      home_searchph: 'e.g. Isango B14, indiza ZW123, ikhofi, Victoria Falls', home_go: 'Ngikhombise',
      q1sub: 'Ibalazwe lesikhumulo', q2sub: 'Ukuphuma & ukufika', q3sub: 'Amathekisi, ama-shuttle, izitimela', q4sub: 'Izitolo, ukudla, ama-lounge',
      gatechange: 'ISANGO LISHINTSHIWE', navigategate: 'Yiya ku-B14',
      discover: 'Hlola isikhumulo', seeall: 'Bona konke',
      footnote: 'SkyPath iwuhlelo lokukhombisa indlela — isekela, ayishintshi, izibonakaliso zesikhumulo.',
      map_title: 'Ngikhombise indlela', lvl2: 'Ukuphuma', lvl1: 'Ukufika',
      map_searchph: 'Cinga isango, isitolo…', route: 'Umzila', dist: 'Ibanga', time: 'Isikhathi', floor: 'Uphansi',
      accessnote: 'Umzila olula · amalift kuphela, akukho zitebhisi', replan: 'Khetha kabusha', startnav: 'Qala',
      hint: 'Thinta uphawu ukuzulazula', nextstep: 'Okulandelayo', arrived: 'Ufikile',
      flights_title: 'Ulwazi lwezindiza ngesikhathi', flights_sub: 'Ukufika nokuphuma kwesikhathi sangempela',
      dep: 'Ukuphuma', arr: 'Ukufika', flights_searchph: 'Inombolo yendiza noma idolobha',
      f_time: 'Isikhathi', f_flight: 'Indiza', f_to: 'Kuya', f_from: 'Iqhamuka', f_gate: 'Isango', f_status: 'Isimo', f_bag: 'Ukukhwela / Umthwalo',
      dynamic: 'Ukusebenza kwezinguquko', dynamicsub: 'Isango lendiza ZW123 lishintshile lisuka ku-B8 laya ku-B14. SkyPath likubona ngaso leso sikhathi.',
      transport_title: 'Fika lapho uya khona', transport_sub: 'Isikhumulo \u2192 idolobha & amahhotela — zonke izinketho esikrinini esisodwa',
      transport_searchph: 'Ihhotela, indawo noma indawo ekhangayo', desthead: 'Ulwazi ngendawo', gateway: 'Isikhumulo \u2192 Zimbabwe',
      qr_title: 'Qhubeka ngocingo lwakho', qr_sub: 'Skene ukuthatha lo mzila nawe.',
      qr_steps: '1 · Vula ikhamera · 2 · Skene · 3 · Landela umugqa oluhlaza', qr_done: 'Kuphelile', sendphone: 'Thumela ocingweni', backhome: 'Buyela ekhaya',
      assist_ph: 'Ngibuze noma yini… isb. "imizuzu engu-45 ngaphambi kokukhwela?"',
      youhere: 'Ulapha', walk: 'Hamba', along: 'ngakhona', then: 'bese', turn: 'Phenduka',
      navstarted: 'Ukuzulazula kuqalile', to: 'ukuya'
    },
    sn: {
      tagline: 'Nhandare Yendege yeHarare', nav_home: 'Musha', nav_map: 'Ndiratidze Nzira',
      nav_flights: 'Ndege', nav_transport: 'Zvokufambisa', nav_discover: 'Wana',
      home_eyebrow: 'Tinokugamuchirai kunhandare yendege yepasi rose yeHarare',
      home_title: 'Kuri kuenda kupi?',
      home_sub: 'Tsvaga gedhi, ndege, nzvimbo kana kwawaenda — ndinokutungamira.',
      home_searchph: 'e.g. Gedhi B14, ndege ZW123, kofi, Victoria Falls', home_go: 'Ndiratidze',
      q1sub: 'Mepu yenharaunda', q2sub: 'Kubuda & kusvika', q3sub: 'Matekisi, shuttles, zvitima', q4sub: 'Zvitoro, chikafu, malounge',
      gatechange: 'GEDHI RACHINJA', navigategate: 'Enda ku-B14',
      discover: 'Ongorora nharaunda', seeall: 'Ona zvose',
      footnote: 'SkyPath ihurongwa hwekutungamira — inotsigira, haiisi chinzvimbo, zvikwangwani zvenhandare.',
      map_title: 'Ndiratidze Nzira', lvl2: 'Kubuda', lvl1: 'Kusvika',
      map_searchph: 'Tsvaga gedhi, shopu…', route: 'Nzira', dist: 'Chinhambwe', time: 'Nguva', floor: 'Nharaunda',
      accessnote: 'Nzira inoshandiswa nevarere · malifiti chete, hapana masitepisi', replan: 'Umbonezve', startnav: 'Tanga',
      hint: 'Bata poindi kuti ufambe', nextstep: 'Zvinotevera', arrived: 'Wasvika',
      flights_title: 'Ruzivo rwendege rwechipiri', flights_sub: 'Ndege dzirikubuda nekusvika nhasi',
      dep: 'Kubuda', arr: 'Kusvika', flights_searchph: 'Nhamba yendege kana guta',
      f_time: 'Nguva', f_flight: 'Ndege', f_to: 'Kuenda', f_from: 'Kubva', f_gate: 'Gedhi', f_status: 'Mamiriro', f_bag: 'Kukwira / Mitoro',
      dynamic: 'Mamiriro eshanduko', dynamicsub: 'Gedhi rendege ZW123 rachinja kubva pa-B8 kuenda pa-B14. SkyPath rinongorora nzira yega yega.',
      transport_title: 'Svika kwawaenda', transport_sub: 'Nhandare \u2192 guta & mahotera — sarudzo dzose pachikuru chimwe',
      transport_searchph: 'Hotera, nzvimbo kana nzvimbo inoshamisa', desthead: 'Ruzivo rwenzvimbo', gateway: 'Nhandare \u2192 Zimbabwe',
      qr_title: 'Endereza parunhare rwako', qr_sub: 'Scan kuti utore nzira iyi newe.',
      qr_steps: '1 · Vhura kamera · 2 · Scan · 3 · Tevedza mutsetse webhururu', qr_done: 'Zvaitwa', sendphone: 'Tumira kurunhare', backhome: 'Dzokera kumba',
      assist_ph: 'Ndibvunze chero chinhu… semuenzaniso "maminetsi 45 tisati takwira?"',
      youhere: 'Muri pano', walk: 'Famba', along: 'ne', then: 'ipapo', turn: 'Tendeuka',
      navstarted: 'Kufamba kwakatanga', to: 'kuenda'
    },
    nd: {
      tagline: 'Isikhumulo sezindiza iHarare', nav_home: 'Ikhaya', nav_map: 'Ngikhombise indlela',
      nav_flights: 'Izindiza', nav_transport: 'Izithuthi', nav_discover: 'Khangela',
      home_eyebrow: 'Siyamukela esikhumulweni sezindiza samazwe amanengi iHarare',
      home_title: 'Uyakuphi?',
      home_sub: 'Khangela isango, indiza, indawo loba lapho uya khona — ngizakukhokhela.',
      home_searchph: 'isb. Isango B14, indiza ZW123, ikofi, Victoria Falls', home_go: 'Ngikhombise',
      q1sub: 'Ibalazwe lesikhumulo', q2sub: 'Ukuphuma & ukufika', q3sub: 'Amathekisi, ama-shuttle, izitimela', q4sub: 'Izitolo, ukudla, ama-lounge',
      gatechange: 'ISANGO LITJHUGULULIWE', navigategate: 'Hamba uye ku-B14',
      discover: 'Hlola isikhumulo', seeall: 'Bona konke',
      footnote: 'SkyPath luhlelo lokukhombisa indlela — lisekela, akulitjhugululi, izibonakaliso zesikhumulo.',
      map_title: 'Ngikhombise indlela', lvl2: 'Ukuphuma', lvl1: 'Ukufika',
      map_searchph: 'Khangela isango, isitolo…', route: 'Umzila', dist: 'Ibanga', time: 'Isikhathi', floor: 'Uphansi',
      accessnote: 'Umzila olula · amalifti kuphela, akukho zitebhisi', replan: 'Khetha kabusha', startnav: 'Qala',
      hint: 'Thinta uphawu ukuzulazula', nextstep: 'Okulandelayo', arrived: 'Ufikile',
      flights_title: 'Ulwazi lwezindiza ngesikhathi', flights_sub: 'Ukuphuma nokufika kwesikhathi namuhla',
      dep: 'Ukuphuma', arr: 'Ukufika', flights_searchph: 'Inombolo yendiza loba idorobha',
      f_time: 'Isikhathi', f_flight: 'Indiza', f_to: 'Ukuya', f_from: 'Ivela', f_gate: 'Isango', f_status: 'Isimo', f_bag: 'Ukukhwela / Umthwalo',
      dynamic: 'Ukusebenza kwezinguquko', dynamicsub: 'Isango lendiza ZW123 litjhugululiwe lisuka ku-B8 laya ku-B14. SkyPath libona lokho ngaso leso sikhathi.',
      transport_title: 'Fika lapho uya khona', transport_sub: 'Isikhumulo \u2192 idorobha & amahhotela — zonke izindlela esikrinini sinye',
      transport_searchph: 'Ihhotela, indawo loba okhangayo', desthead: 'Ulwazi ngendawo', gateway: 'Isikhumulo \u2192 Zimbabwe',
      qr_title: 'Qhubeka ngocingo lwakho', qr_sub: 'Skene ukuthatha lo mzila nawe.',
      qr_steps: '1 · Vula ikhamera · 2 · Skene · 3 · Landela umugqa oluhlaza', qr_done: 'Kuphele', sendphone: 'Thumela ocingweni', backhome: 'Buyela ekhaya',
      assist_ph: 'Ngibuze loba yini… isb. "imizuzu engu-45 ngaphambi kokukhwela?"',
      youhere: 'Ulapha', walk: 'Hamba', along: 'ngakhona', then: 'bese', turn: 'Phenduka',
      navstarted: 'Ukuzulazula kuqalile', to: 'ukuya'
    },
    zh: {
      tagline: '哈拉雷国际机场', nav_home: '首页', nav_map: '导航',
      nav_flights: '航班', nav_transport: '交通', nav_discover: '探索',
      home_eyebrow: '欢迎来到罗伯特·穆加贝国际机场',
      home_title: '您要去哪里？',
      home_sub: '搜索登机口、航班、设施或目的地 — 我将为您指引方向。',
      home_searchph: '例如：登机口 B14、航班 ZW123、咖啡、维多利亚瀑布', home_go: '开始导航',
      q1sub: '互动航站楼地图', q2sub: '出发与到达', q3sub: '出租车、班车、火车', q4sub: '商店、餐饮、贵宾厅',
      gatechange: '登机口变更', navigategate: '前往 B14',
      discover: '探索航站楼', seeall: '查看全部',
      footnote: 'SkyPath 是分层导航系统 — 它辅助但不替代机场标识和紧急程序。',
      map_title: '导航', lvl2: '出发层', lvl1: '到达层',
      map_searchph: '搜索登机口、商店、设施…', route: '路线', dist: '距离', time: '步行时间', floor: '楼层',
      accessnote: '无障碍路线 · 仅乘电梯，无楼梯', replan: '重新规划', startnav: '开始导航',
      hint: '点击标记进行导航', nextstep: '下一步', arrived: '已到达',
      flights_title: '实时航班信息', flights_sub: '今日出发与到达的实时信息',
      dep: '出发', arr: '到达', flights_searchph: '航班号或城市',
      f_time: '时间', f_flight: '航班', f_to: '目的地', f_from: '出发地', f_gate: '登机口', f_status: '状态', f_bag: '登机/行李',
      dynamic: '动态干扰处理', dynamicsub: 'ZW123 的登机口从 B8 改为 B14。SkyPath 即时为每位乘客重新规划路线。',
      transport_title: '前往目的地', transport_sub: '机场 → 城市及酒店 — 所有选项，一屏呈现',
      transport_searchph: '酒店、街区或景点', desthead: '目的地信息', gateway: '机场 → 津巴布韦',
      qr_title: '在手机上继续', qr_sub: '扫描即可将此路线随身携带。',
      qr_steps: '1 · 打开相机 · 2 · 扫描二维码 · 3 · 沿蓝线行走', qr_done: '完成', sendphone: '发送到手机', backhome: '返回首页',
      assist_ph: '问我任何问题…例如"登机前还有45分钟？"',
      youhere: '您在这里', walk: '步行', along: '沿着', then: '然后', turn: '转弯',
      navstarted: '导航已开始', to: '前往'
    },
    es: {
      tagline: 'Aeropuerto Internacional de Harare', nav_home: 'Inicio', nav_map: 'Navegar',
      nav_flights: 'Vuelos', nav_transport: 'Transporte', nav_discover: 'Explorar',
      home_eyebrow: 'Bienvenido al Aeropuerto Internacional Robert Gabriel Mugabe',
      home_title: '¿A dónde vas?',
      home_sub: 'Busca una puerta, vuelo, servicio o destino — te guiaré.',
      home_searchph: 'ej. Puerta B14, vuelo ZW123, café, Cataratas Victoria', home_go: 'Encontrar',
      q1sub: 'Mapa interactivo del terminal', q2sub: 'Salidas y llegadas', q3sub: 'Taxis, autobuses, trenes', q4sub: 'Tiendas, restaurantes, salones',
      gatechange: 'CAMBIO DE PUERTA', navigategate: 'Ir a B14',
      discover: 'Explorar el terminal', seeall: 'Ver todo',
      footnote: 'SkyPath es un sistema de navegación por capas — apoya, nunca reemplaza, la señalización y procedimientos de emergencia.',
      map_title: 'Navegar', lvl2: 'Salidas', lvl1: 'Llegadas',
      map_searchph: 'Buscar puerta, tienda, servicio…', route: 'Ruta', dist: 'Distancia', time: 'Tiempo a pie', floor: 'Planta',
      accessnote: 'Ruta accesible · solo ascensores, sin escaleras', replan: 'Recalcular', startnav: 'Iniciar navegación',
      hint: 'Toca un punto para navegar', nextstep: 'Siguiente', arrived: 'Has llegado',
      flights_title: 'Información de vuelos en vivo', flights_sub: 'Salidas y llegadas en tiempo real',
      dep: 'Salidas', arr: 'Llegadas', flights_searchph: 'N° de vuelo o ciudad',
      f_time: 'Hora', f_flight: 'Vuelo', f_to: 'Destino', f_from: 'Origen', f_gate: 'Puerta', f_status: 'Estado', f_bag: 'Embarque / Equipaje',
      dynamic: 'Gestión dinámica de interrupciones', dynamicsub: 'La puerta del vuelo ZW123 cambió de B8 a B14. SkyPath recalcula al instante.',
      transport_title: 'Llega a tu destino', transport_sub: 'Aeropuerto → Ciudad y hoteles — todas las opciones, una pantalla',
      transport_searchph: 'Hotel, barrio o atracción', desthead: 'Información del destino', gateway: 'Aeropuerto → Zimbabue',
      qr_title: 'Continúa en tu teléfono', qr_sub: 'Escanea para llevar esta ruta contigo.',
      qr_steps: '1 · Abre la cámara · 2 · Escanea · 3 · Sigue la línea azul', qr_done: 'Listo', sendphone: 'Enviar al teléfono', backhome: 'Volver al inicio',
      assist_ph: 'Pregúntame algo… ej. "¿45 minutos antes del embarque?"',
      youhere: 'Estás aquí', walk: 'Camina', along: 'por', then: 'luego', turn: 'Gira',
      navstarted: 'Navegación iniciada', to: 'hacia'
    },
    pt: {
      tagline: 'Aeroporto Internacional de Harare', nav_home: 'Início', nav_map: 'Navegar',
      nav_flights: 'Voos', nav_transport: 'Transporte', nav_discover: 'Explorar',
      home_eyebrow: 'Bem-vindo ao Aeroporto Internacional Robert Gabriel Mugabe',
      home_title: 'Para onde vai?',
      home_sub: 'Pesquise um portão, voo, serviço ou destino — eu o guiarei.',
      home_searchph: 'ex. Portão B14, voo ZW123, café, Cataratas Victoria', home_go: 'Encontrar',
      q1sub: 'Mapa interativo do terminal', q2sub: 'Partidas e chegadas', q3sub: 'Táxis, ônibus, trens', q4sub: 'Lojas, restaurantes, salões',
      gatechange: 'MUDANÇA DE PORTÃO', navigategate: 'Ir para B14',
      discover: 'Explorar o terminal', seeall: 'Ver tudo',
      footnote: 'SkyPath é um sistema de navegação em camadas — apoia, nunca substitui, a sinalização e procedimentos de emergência.',
      map_title: 'Navegar', lvl2: 'Partidas', lvl1: 'Chegadas',
      map_searchph: 'Pesquisar portão, loja, serviço…', route: 'Rota', dist: 'Distância', time: 'Tempo a pé', floor: 'Andar',
      accessnote: 'Rota acessível · apenas elevadores, sem escadas', replan: 'Recalcular', startnav: 'Iniciar navegação',
      hint: 'Toque em um ponto para navegar', nextstep: 'Próximo', arrived: 'Você chegou',
      flights_title: 'Informações de voos ao vivo', flights_sub: 'Partidas e chegadas em tempo real',
      dep: 'Partidas', arr: 'Chegadas', flights_searchph: 'N° do voo ou cidade',
      f_time: 'Hora', f_flight: 'Voo', f_to: 'Destino', f_from: 'Origem', f_gate: 'Portão', f_status: 'Estado', f_bag: 'Embarque / Bagagem',
      dynamic: 'Gestão dinâmica de interrupções', dynamicsub: 'O portão do voo ZW123 mudou de B8 para B14. O SkyPath recalcula instantaneamente.',
      transport_title: 'Chegue ao seu destino', transport_sub: 'Aeroporto → Cidade e hotéis — todas as opções, uma tela',
      transport_searchph: 'Hotel, bairro ou atração', desthead: 'Informações do destino', gateway: 'Aeroporto → Zimbábue',
      qr_title: 'Continue no seu celular', qr_sub: 'Escaneie para levar esta rota com você.',
      qr_steps: '1 · Abra a câmera · 2 · Escaneie · 3 · Siga a linha azul', qr_done: 'Pronto', sendphone: 'Enviar ao celular', backhome: 'Voltar ao início',
      assist_ph: 'Pergunte-me qualquer coisa… ex. "45 minutos antes do embarque?"',
      youhere: 'Você está aqui', walk: 'Caminhe', along: 'ao longo de', then: 'depois', turn: 'Vire',
      navstarted: 'Navegação iniciada', to: 'para'
    },
    de: {
      tagline: 'Internationaler Flughafen Harare', nav_home: 'Startseite', nav_map: 'Wegfindung',
      nav_flights: 'Flüge', nav_transport: 'Verkehr', nav_discover: 'Entdecken',
      home_eyebrow: 'Willkommen am Robert Gabriel Mugabe International Airport',
      home_title: 'Wohin möchten Sie?',
      home_sub: 'Suchen Sie ein Gate, einen Flug, eine Einrichtung oder ein Ziel — ich führe Sie dorthin.',
      home_searchph: 'z.B. Gate B14, Flug ZW123, Kaffee, Victoriafälle', home_go: 'Route finden',
      q1sub: 'Interaktive Terminalkarte', q2sub: 'Abflüge & Ankünfte', q3sub: 'Taxis, Shuttle, Züge', q4sub: 'Shops, Restaurants, Lounges',
      gatechange: 'GATE-ÄNDERUNG', navigategate: 'Nach B14',
      discover: 'Terminal erkunden', seeall: 'Alle anzeigen',
      footnote: 'SkyPath ist ein mehrschichtiges Navigationssystem — es unterstützt, ersetzt nie, die Beschilderung und Notfallverfahren.',
      map_title: 'Wegfindung', lvl2: 'Abflug', lvl1: 'Ankunft',
      map_searchph: 'Gate, Shop, Einrichtung suchen…', route: 'Route', dist: 'Entfernung', time: 'Fußweg', floor: 'Etage',
      accessnote: 'Barrierefreie Route · nur Aufzüge, keine Treppen', replan: 'Neu planen', startnav: 'Navigation starten',
      hint: 'Tippen Sie auf eine Markierung', nextstep: 'Weiter', arrived: 'Sie sind angekommen',
      flights_title: 'Live-Fluginformationen', flights_sub: 'Echtzeit-Abflüge und Ankünfte',
      dep: 'Abflüge', arr: 'Ankünfte', flights_searchph: 'Flugnr. oder Stadt',
      f_time: 'Zeit', f_flight: 'Flug', f_to: 'Nach', f_from: 'Von', f_gate: 'Gate', f_status: 'Status', f_bag: 'Boarding / Gepäck',
      dynamic: 'Dynamische Störungsbehandlung', dynamicsub: 'Flug ZW123 Gate-Änderung von B8 nach B14. SkyPath leitet alle Passagiere um.',
      transport_title: 'Ziel erreichen', transport_sub: 'Flughafen → Stadt & Hotels — alle Optionen auf einem Bildschirm',
      transport_searchph: 'Hotel, Bezirk oder Sehenswürdigkeit', desthead: 'Zielinformationen', gateway: 'Flughafen → Simbabwe',
      qr_title: 'Auf dem Handy fortsetzen', qr_sub: 'Scannen Sie, um diese Route mitzunehmen.',
      qr_steps: '1 · Kamera öffnen · 2 · Scannen · 3 · Der blauen Linie folgen', qr_done: 'Fertig', sendphone: 'An Handy senden', backhome: 'Zurück zur Startseite',
      assist_ph: 'Fragen Sie mich alles… z.B. "45 Minuten vor dem Boarding?"',
      youhere: 'Sie sind hier', walk: 'Gehen Sie', along: 'entlang', then: 'dann', turn: 'Biegen Sie ab',
      navstarted: 'Navigation gestartet', to: 'nach'
    },
    ar: {
      tagline: 'مطار هراري الدولي', nav_home: 'الرئيسية', nav_map: 'التنقل',
      nav_flights: 'الرحلات', nav_transport: 'المواصلات', nav_discover: 'اكتشف',
      home_eyebrow: 'مرحباً بكم في مطار روبرت غابرييل موغابي الدولي',
      home_title: 'إلى أين تريد الذهاب؟',
      home_sub: 'ابحث عن بوابة أو رحلة أو خدمة أو وجهة — سأرشدك.',
      home_searchph: 'مثلاً: بوابة B14، رحلة ZW123، قهوة، شلالات فيكتوريا', home_go: 'ابدأ',
      q1sub: 'خريطة الم termininteractive', q2sub: 'المغادرون والقادمون', q3sub: 'تاكسي، حافلات، قطار', q4sub: 'متاجر، مطاعم، صالة',
      gatechange: 'تغير بوابة الصعود', navigategate: 'إلى B14',
      discover: 'استكشف الم termin', seeall: 'عرض الكل',
      footnote: 'SkyPath نظام توجيه متعدد الطبقات — يدعم، لا يحل محل، لوحات المطار وإجراءات الطوارئ.',
      map_title: 'التنقل', lvl2: 'المغادرون', lvl1: 'القادمون',
      map_searchph: 'ابحث عن بوابة، متجر، خدمة…', route: 'المسار', dist: 'المسافة', time: 'وقت المشي', floor: 'الطابق',
      accessnote: 'مسار ذوي الاحتياجات الخاصة · مصاعد فقط بدون درج', replan: 'إعادة التخطيط', startnav: 'ابدأ الملاحة',
      hint: 'اضغط على علامة للتنقل', nextstep: 'التالي', arrived: 'وصلت',
      flights_title: 'معلومات الرحلات المباشرة', flights_sub: 'المغادرون والقادمون في الوقت الفعلي',
      dep: 'المغادرون', arr: 'القادمون', flights_searchph: 'رحلة أو مدينة',
      f_time: 'الوقت', f_flight: 'الرحلة', f_to: 'الوجهة', f_from: 'المصدر', f_gate: 'البوابة', f_status: 'الحالة', f_bag: 'الصعود / الأمتعة',
      dynamic: 'معالجة التعطل الديناميكي', dynamicsub: 'تغيرت بوابة ZW123 من B8 إلى B14. يعيد SkyPath التوجيه فوراً.',
      transport_title: 'اصل إلى وجهتك', transport_sub: 'المطار → المدينة والفنادق — كل الخيارات، شاشة واحدة',
      transport_searchph: 'فندق، حي أو معلم', desthead: 'معلومات الوجهة', gateway: 'المطار → زيمبابوي',
      qr_title: 'تابع على هاتفك', qr_sub: 'امسح الرمز للحصول على هذا المسار.',
      qr_steps: '1 · افتح الكاميرا · 2 · امسح الرمز · 3 · اتبع الخط الأزرق', qr_done: 'تم', sendphone: 'إرسال للهاتف', backhome: 'العودة للرئيسية',
      assist_ph: 'اسألني أي شيء… مثلاً "45 دقيقة قبل الصعود؟"',
      youhere: 'أنت هنا', walk: 'امشِ', along: 'على طول', then: 'ثم', turn: 'انعطف',
      navstarted: 'بدأت الملاحة', to: 'إلى'
    },
    hi: {
      tagline: 'हरारे अंतर्राष्ट्रीय हवाई अड्डा', nav_home: 'होम', nav_map: 'दिशा',
      nav_flights: 'उड़ानें', nav_transport: 'परिवहन', nav_discover: 'खोजें',
      home_eyebrow: 'रॉबर्ट गैब्रियल मुगाबे अंतर्राष्ट्रीय हवाई अड्डे पर आपका स्वागत है',
      home_title: 'आप कहाँ जा रहे हैं?',
      home_sub: 'गेट, उड़ान, सुविधा या गंतव्य खोजें — मैं आपको वहाँ ले जाऊँगा।',
      home_searchph: 'उदा: गेट B14, उड़ान ZW123, कॉफ़ी, विक्टोरिया फॉल्स', home_go: 'खोजें',
      q1sub: 'इंटरैक्टिव टर्मिनल मानचित्र', q2sub: 'प्रस्थान और आगमन', q3sub: 'टैक्सी, शटल, ट्रेन', q4sub: 'दुकानें, रेस्तरां, लाउंज',
      gatechange: 'गेट परिवर्तन', navigategate: 'B14 जाएँ',
      discover: 'टर्मिनल खोजें', seeall: 'सभी देखें',
      footnote: 'SkyPath एक परत-दर-परत दिशा प्रणाली है — यह सहायता प्रदान करता है, हवाई अड्डे के संकेतों और आपातकालीन प्रक्रियाओं का विकल्प नहीं है।',
      map_title: 'दिशा', lvl2: 'प्रस्थान', lvl1: 'आगमन',
      map_searchph: 'गेट, दुकान, सुविधा खोजें…', route: 'मार्ग', dist: 'दूरी', time: 'पैदल समय', floor: 'मंज़िल',
      accessnote: 'सुलभ मार्ग · केवल लिफ्ट, कोई सीढ़ी नहीं', replan: 'पुनर्योजन', startnav: 'दिशा शुरू करें',
      hint: 'दिशा के लिए चिह्न पर टैप करें', nextstep: 'अगला', arrived: 'आप पहुँच गए',
      flights_title: 'लाइव उड़ान जानकारी', flights_sub: 'आज की वास्तविक समय प्रस्थान और आगमन',
      dep: 'प्रस्थान', arr: 'आगमन', flights_searchph: 'उड़ान संख्या या शहर',
      f_time: 'समय', f_flight: 'उड़ान', f_to: 'गंतव्य', f_from: 'स्रोत', f_gate: 'गेट', f_status: 'स्थिति', f_bag: 'बोर्डिंग / सामान',
      dynamic: 'गतिशील व्यवधान प्रबंधन', dynamicsub: 'ZW123 का गेट B8 से B14 बदल गया। SkyPath तुरंत सभी यात्रियों को पुनर्निर्देशित करता है।',
      transport_title: 'अपने गंतव्य पर पहुँचें', transport_sub: 'हवाई अड्डा → शहर और होटल — सभी विकल्प, एक स्क्रीन',
      transport_searchph: 'होटल, मोहल्ला या आकर्षण', desthead: 'गंतव्य जानकारी', gateway: 'हवाई अड्डा → ज़िम्बाब्वे',
      qr_title: 'अपने फ़ोन पर जारी रखें', qr_sub: 'इस मार्ग को ले जाने के लिए स्कैन करें।',
      qr_steps: '1 · कैमरा खोलें · 2 · स्कैन करें · 3 · नीली रेखा का पालन करें', qr_done: 'हो गया', sendphone: 'फ़ोन पर भेजें', backhome: 'होम वापस',
      assist_ph: 'मुझसे कुछ भी पूछें… जैसे "बोर्डिंग से 45 मिनट पहले?"',
      youhere: 'आप यहाँ हैं', walk: 'चलें', along: 'के साथ-साथ', then: 'फिर', turn: 'मुड़ें',
      navstarted: 'दिशा शुरू', to: 'की ओर'
    }
  };
  let LANG = 'en';
  const t = (k) => {
    const flat = k.replace(/\./g, '_');
    if (I18N[LANG] && I18N[LANG][flat] !== undefined) return I18N[LANG][flat];
    if (I18N.en[flat] !== undefined) return I18N.en[flat];
    const suffix = k.split('.').pop();
    if (I18N[LANG] && I18N[LANG][suffix] !== undefined) return I18N[LANG][suffix];
    if (I18N.en[suffix] !== undefined) return I18N.en[suffix];
    return k;
  };

  /* ---------------- terminal graph ---------------- */
  const NODES = {};
  const EDGES = {}; // nodeId -> [{id, distUnits}]

  function addNode(id, level, x, y, label, iconName, opts) {
    NODES[id] = { id, level, x, y, label, icon: iconName || 'pin', opts: opts || {} };
    EDGES[id] = EDGES[id] || [];
  }
  function link(a, b) {
    const d = Math.hypot(NODES[a].x - NODES[b].x, NODES[a].y - NODES[b].y);
    EDGES[a].push({ id: b, d }); EDGES[b].push({ id: a, d });
  }

  // ---- Level 2 (Departures) ----
  const L2_COR = [130, 180, 220, 300, 390, 420, 480, 540, 580, 660, 680, 760, 780, 850, 900, 930, 950];
  L2_COR.forEach((x, i) => addNode('c2_' + i, 'L2', x, 310, '', null, { cor: true }));
  addNode('sec', 'L2', 130, 310, 'Security Exit', 'shield');
  addNode('dutyfree', 'L2', 220, 310, 'Duty Free', 'bag');
  addNode('cafe', 'L2', 390, 310, 'Café', 'coffee');
  addNode('restaurant', 'L2', 480, 310, 'Restaurant', 'food');
  addNode('info', 'L2', 580, 310, 'Information', 'info');
  addNode('restrooms', 'L2', 680, 310, 'Restrooms', 'wc');
  addNode('prayer', 'L2', 760, 310, 'Prayer Room', 'prayer');
  addNode('pharmacy', 'L2', 850, 310, 'Pharmacy', 'pharmacy');
  addNode('bank', 'L2', 900, 310, 'Bank · Currency', 'bank');
  addNode('lifts2', 'L2', 930, 310, 'Lifts', 'elev');
  addNode('transport2', 'L2', 950, 310, 'Ground Transport', 'car');
  addNode('lounge', 'L2', 950, 120, 'Sky Lounge', 'lounge');
  addNode('securityArea', 'L2', 130, 120, 'Security', 'shield');
  ['A1','A2','A3','A4','A5','A6'].forEach((g, i) => addNode('g' + g, 'L2', 180 + i * 120, 120, 'Gate ' + g, 'plane', { gate: true }));
  ['B7','B8','B9','B10','B11','B12','B13','B14'].forEach((g, i) => addNode('g' + g, 'L2', 180 + i * 100, 500, 'Gate ' + g, 'plane', { gate: true }));

  for (let i = 0; i < L2_COR.length - 1; i++) link('c2_' + i, 'c2_' + (i + 1));
  link('sec', 'c2_0');
  link('securityArea', 'c2_0');
  link('dutyfree', 'c2_2');
  link('cafe', 'c2_5');
  link('restaurant', 'c2_6');
  link('info', 'c2_7');
  link('restrooms', 'c2_9');
  link('prayer', 'c2_11');
  link('pharmacy', 'c2_13');
  link('bank', 'c2_14');
  link('lifts2', 'c2_15');
  link('transport2', 'c2_16');
  link('lounge', 'c2_16');
  ['A1','A2','A3','A4','A5','A6'].forEach((g, i) => { link('g' + g, 'c2_' + (1 + i * 2)); });
  ['B7','B8','B9','B10','B11','B12','B13','B14'].forEach((g, i) => { link('g' + g, 'c2_' + [1,3,4,6,8,10,12,14][i]); });

  // ---- Level 1 (Arrivals) ----
  const L1_COR = [300, 430, 440, 560, 580, 700, 720, 800, 860, 920, 940];
  L1_COR.forEach((x, i) => addNode('c1_' + i, 'L1', x, 420, '', null, { cor: true }));
  addNode('arrHere', 'L1', 300, 300, 'Customs Exit', 'walk');
  addNode('currency', 'L1', 300, 420, 'Currency Exchange', 'bank');
  addNode('rest1', 'L1', 430, 420, 'Restrooms', 'wc');
  addNode('hotelDesk', 'L1', 560, 420, 'Hotel & Tours', 'hotel');
  addNode('info1', 'L1', 700, 420, 'Information', 'info');
  addNode('lifts1', 'L1', 920, 420, 'Lifts', 'elev');
  addNode('exit1', 'L1', 940, 420, 'City Exit', 'right');
  addNode('taxi', 'L1', 860, 140, 'Taxi Rank', 'car');
  addNode('shuttle', 'L1', 940, 140, 'City Shuttle', 'bus');
  addNode('train', 'L1', 940, 240, 'Rail Link', 'train');
  addNode('rental', 'L1', 860, 320, 'Car Rental', 'car');
  ['1','2','3','4'].forEach((n) => addNode('c' + n, 'L1', 300 + (n - 1) * 140, 120, 'Carousel ' + n, 'luggage', { carousel: true }));

  for (let i = 0; i < L1_COR.length - 1; i++) link('c1_' + i, 'c1_' + (i + 1));
  link('arrHere', 'c1_0');
  link('currency', 'c1_0');
  link('rest1', 'c1_1');
  link('hotelDesk', 'c1_3');
  link('info1', 'c1_5');
  link('lifts1', 'c1_9');
  link('exit1', 'c1_10');
  link('rental', 'c1_7');
  link('taxi', 'c1_7');
  link('shuttle', 'c1_10');
  link('train', 'c1_10');
  ['1','2','3','4'].forEach((n, i) => link('c' + n, 'c1_' + (i * 2)));

  /* ---------------- routing ---------------- */
  function route(startId, endId) {
    const start = NODES[startId], end = NODES[endId];
    if (!start || !end) return null;
    // same level
    if (start.level === end.level) return { segments: [{ level: start.level, path: astar(startId, endId, start.level) }], levels: [start.level] };
    // cross level via lifts
    const a = start.level === 'L2' ? 'lifts2' : 'lifts1';
    const b = end.level === 'L2' ? 'lifts2' : 'lifts1';
    return {
      segments: [
        { level: start.level, path: astar(startId, a, start.level), viaLift: true, toLevel: end.level },
        { level: end.level, path: astar(b, endId, end.level) }
      ],
      levels: [start.level, end.level]
    };
  }
  function astar(startId, endId, level) {
    const open = [{ id: startId, g: 0, f: 0 }];
    const came = {}; const gscore = {}; const closed = {};
    gscore[startId] = 0;
    while (open.length) {
      open.sort((x, y) => x.f - y.f);
      const cur = open.shift();
      if (cur.id === endId) break;
      if (closed[cur.id]) continue;
      closed[cur.id] = true;
      for (const e of EDGES[cur.id]) {
        if (NODES[e.id].level !== level) continue;
        const ng = gscore[cur.id] + e.d;
        if (gscore[e.id] === undefined || ng < gscore[e.id]) {
          gscore[e.id] = ng; came[e.id] = cur.id;
          open.push({ id: e.id, g: ng, f: ng + Math.hypot(NODES[e.id].x - NODES[endId].x, NODES[e.id].y - NODES[endId].y) });
        }
      }
    }
    if (!came[endId] && endId !== startId) return [startId];
    const path = [endId]; let c = endId;
    while (c !== startId && came[c]) { c = came[c]; path.unshift(c); }
    return path;
  }
  function metersOf(path) {
    let u = 0;
    for (let i = 0; i < path.length - 1; i++) u += Math.hypot(NODES[path[i]].x - NODES[path[i + 1]].x, NODES[path[i]].y - NODES[path[i + 1]].y);
    return u * M2F;
  }
  function stepsOf(routeObj) {
    const steps = [];
    routeObj.segments.forEach((seg, si) => {
      const path = seg.path;
      let i = 0;
      while (i < path.length - 1) {
        const j = i + 1;
        const a = NODES[path[i]], b = NODES[path[j]];
        const dx = b.x - a.x, dy = b.y - a.y;
        const horiz = Math.abs(dx) >= Math.abs(dy);
        const dist = Math.hypot(dx, dy) * M2F;
        if (dist < 4) { i = j; continue; }
        const dir = horiz ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        let name = 'terminal';
        if (seg.level === 'L2' && a.y === 310 && b.y === 310) name = 'Main Concourse';
        else if (seg.level === 'L1' && a.y === 420 && b.y === 420) name = 'Arrivals Hall';
        else if (horiz) name = 'Concourse';
        steps.push({ text: `${t('walk')} ${Math.round(dist / 5) * 5} m ${t('along')} ${name}`, dir, dist, name });
        i = j;
      }
      if (seg.viaLift) {
        steps.push({ text: `Take the lift ${seg.toLevel === 'L1' ? 'down' : 'up'} to Level ${seg.toLevel === 'L1' ? '1 · Arrivals' : '2 · Departures'}`, dir: 'elev', dist: 0, name: 'Lifts', lift: true });
      }
      if (si < routeObj.segments.length - 1) {
        const dest = routeObj.segments[si + 1].path[routeObj.segments[si + 1].path.length - 1];
        steps.push({ text: `Follow to ${NODES[dest].label}`, dir: 'pin', dist: 0, name: NODES[dest].label });
      }
    });
    return steps;
  }

  /* ---------------- data: facilities, flights, transport, intel ---------------- */
  const FACILITIES = [
    { n: 'dutyfree', cat: 'shop', distL2: '2 min' }, { n: 'cafe', cat: 'food', distL2: '3 min' },
    { n: 'restaurant', cat: 'food', distL2: '4 min' }, { n: 'info', cat: 'info', distL2: '4 min' },
    { n: 'restrooms', cat: 'wc', distL2: '5 min' }, { n: 'prayer', cat: 'worship', distL2: '5 min' },
    { n: 'pharmacy', cat: 'health', distL2: '6 min' }, { n: 'bank', cat: 'bank', distL2: '6 min' },
    { n: 'lounge', cat: 'lounge', distL2: '8 min' }, { n: 'lifts2', cat: 'elev', distL2: '7 min' },
    { n: 'currency', cat: 'bank', distL1: '2 min' }, { n: 'hotelDesk', cat: 'hotel', distL1: '4 min' },
    { n: 'taxi', cat: 'transport', distL1: '4 min' }, { n: 'shuttle', cat: 'transport', distL1: '5 min' },
    { n: 'train', cat: 'transport', distL1: '6 min' }, { n: 'rental', cat: 'transport', distL1: '6 min' }
  ];
  const CAT_META = {
    shop: { label: 'Duty Free', icon: 'bag' }, food: { label: 'Food & Drink', icon: 'food' },
    info: { label: 'Information', icon: 'info' }, wc: { label: 'Restrooms', icon: 'wc' },
    worship: { label: 'Prayer Room', icon: 'prayer' }, health: { label: 'Pharmacy', icon: 'pharmacy' },
    bank: { label: 'Banking', icon: 'bank' }, lounge: { label: 'Lounge', icon: 'lounge' },
    elev: { label: 'Lifts', icon: 'elev' }, hotel: { label: 'Hotel & Tours', icon: 'hotel' },
    transport: { label: 'Transport', icon: 'car' }
  };

  const FLIGHTS = {
    dep: [
      { time: '09:15', code: 'ZW123', city: 'Johannesburg', gate: 'B14', oldGate: 'B8', status: 'now', bag: 'Boarding 09:00', pct: 72 },
      { time: '09:40', code: 'ZW305', city: 'Harare', gate: 'A3', status: 'boarding', bag: 'Boarding', pct: 40 },
      { time: '10:05', code: 'BA54', city: 'London (LHR)', gate: 'B9', status: 'ontime', bag: 'Board 09:35' },
      { time: '10:30', code: 'ET814', city: 'Addis Ababa', gate: 'A5', status: 'delay', bag: 'Delayed +60 min', delay: 60 },
      { time: '11:00', code: 'KQ722', city: 'Nairobi', gate: 'B12', status: 'ontime', bag: 'Board 10:30' },
      { time: '11:35', code: 'SA169', city: 'Cape Town', gate: 'A1', status: 'ontime', bag: 'Board 11:05' },
      { time: '12:10', code: 'EK708', city: 'Dubai', gate: 'B10', status: 'delay', bag: 'Delayed +30 min', delay: 30 },
      { time: '12:45', code: 'UA860', city: 'Frankfurt', gate: 'A2', status: 'ontime', bag: 'Board 12:15' },
      { time: '13:20', code: 'FN128', city: 'Victoria Falls', gate: 'A4', status: 'checkin', bag: 'Check-in open' }
    ],
    arr: [
      { time: '08:50', code: 'ZW302', city: 'Harare', gate: 'B8', status: 'landed', bag: 'Carousel 2' },
      { time: '09:25', code: 'SA168', city: 'Cape Town', gate: 'A6', status: 'landed', bag: 'Carousel 3' },
      { time: '10:00', code: 'ET813', city: 'Addis Ababa', gate: 'B7', status: 'approach', bag: 'Carousel 1' },
      { time: '10:45', code: 'KQ721', city: 'Nairobi', gate: 'A5', status: 'approach', bag: 'Carousel 4' },
      { time: '11:20', code: 'BA53', city: 'London (LHR)', gate: 'B11', status: 'schedule', bag: 'Carousel 1' },
      { time: '11:55', code: 'EK707', city: 'Dubai', gate: 'A2', status: 'schedule', bag: 'Carousel 2' },
      { time: '12:30', code: 'UA859', city: 'Frankfurt', gate: 'B13', status: 'schedule', bag: 'Carousel 3' }
    ]
  };
  const STATUS_META = {
    now: { cls: 'st-boarding', label: 'Now boarding' }, boarding: { cls: 'st-boarding', label: 'Boarding' },
    ontime: { cls: 'st-on', label: 'On time' }, checkin: { cls: 'st-on', label: 'Check-in' },
    delay: { cls: 'st-delay', label: 'Delayed' }, landed: { cls: 'st-arr', label: 'Landed' },
    approach: { cls: 'st-arr', label: 'On approach' }, schedule: { cls: 'st-on', label: 'Scheduled' }
  };

  const TRANSPORT = [
    { id: 'taxi', name: 'Taxi', icon: 'car', time: '25 min', cost: '$18–$25', zone: 'Taxi Rank · L1', next: 'Immediate', note: '24/7 · metered · licensed', rec: true, color: 'linear-gradient(135deg,#FB923C,#EA580C)' },
    { id: 'shuttle', name: 'City Shuttle', icon: 'bus', time: '35 min', cost: '$6', zone: 'Bus Bay 1 · L1', next: '14:35', note: 'City Centre & hotels', color: 'linear-gradient(135deg,#38BDF8,#0284C7)' },
    { id: 'rental', name: 'Car Rental', icon: 'car', time: '15 min', cost: '$38/day', zone: 'Rental Row · L1', next: '09:00 open', note: 'Avis · Europcar · Imperial', color: 'linear-gradient(135deg,#2DD4BF,#0D9488)' },
    { id: 'train', name: 'Rail Link', icon: 'train', time: '40 min', cost: '$4', zone: 'Rail Station · L1', next: '15:10', note: 'To National Rail hub', color: 'linear-gradient(135deg,#A78BFA,#7C3AED)' },
    { id: 'walk', name: 'Hotel Shuttle', icon: 'walk', time: '5 min', cost: 'Free', zone: 'Meet & Greet · L1', next: 'Every 20 min', note: 'Partner hotels · badge required', color: 'linear-gradient(135deg,#34D399,#059669)' }
  ];

  const INTEL = [
    { city: 'Victoria Falls', temp: '23°', icon: 'sun', time: '1 h 10 m', dist: '~80 km', tags: ['Mosi-oa-Tunya', 'Hotels', 'Tours'] },
    { city: 'Harare City', temp: '19°', icon: 'cloud', time: '35 min', dist: '~30 km', tags: ['Business', 'Hotels', 'Culture'] },
    { city: 'Nyanga', temp: '16°', icon: 'rain', time: '4 h 30 m', dist: '~290 km', tags: ['Mountains', 'Resorts'] },
    { city: 'Great Zimbabwe', temp: '21°', icon: 'sun', time: '3 h 20 m', dist: '~250 km', tags: ['UNESCO', 'Heritage'] },
    { city: 'Kariba', temp: '27°', icon: 'sun', time: '5 h 10 m', dist: '~370 km', tags: ['Lake', 'Game', 'Houseboats'] }
  ];

  const TICKER = [
    '<em>ZW123</em> Gate change <b>B8 → B14</b> — re-route instantly',
    '<em>Security</em> Standard lane ~8 min · Priority lane ~2 min',
    '<em>ET814</em> Delayed 60 min · boarding now 11:10',
    '<em>Sky Lounge</em> Free Wi-Fi · show your boarding pass',
    '<em>City Shuttle</em> next departure 14:35 · Bus Bay 1',
    '<em>SA168</em> baggage on carousel 3',
    '<em>FN128</em> Victoria Falls — check-in open · Gate A4'
  ];

  /* ============================================================
     MAP RENDER
     ============================================================ */
  const $canvas = $('#mapCanvas');
  const YOUHERE = { L2: 'sec', L1: 'arrHere' };

  function zoneRect(x, y, w, h, opts) {
    return `<rect class="mzone" x="${x}" y="${y}" width="${w}" height="${h}" rx="12" ${opts && opts.dash ? 'stroke-dasharray="5 4"' : ''}/>`;
  }

  function zoneLabel(x, y, text) {
    const w = Math.max(44, text.length * 7 + 20);
    return `<g class="zlabel"><rect x="${x - w / 2}" y="${y - 11}" width="${w}" height="22" rx="11" fill="#fff" stroke="#BAE6FD" stroke-width="1.5"/><text x="${x}" y="${y + 4}" text-anchor="middle">${text}</text></g>`;
  }

  function buildSvg(level, destId) {
    const parts = [];
    parts.push(`<svg viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Terminal map ${level}">`);
    parts.push('<defs><linearGradient id="mapBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FDFEFF"/><stop offset="1" stop-color="#EAF6FE"/></linearGradient></defs>');
    parts.push(`<rect x="0" y="0" width="1000" height="620" rx="16" fill="url(#mapBg)"/>`);

    if (level === 'L2') {
      parts.push(zoneRect(85, 285, 880, 50));
      parts.push(zoneRect(140, 65, 740, 55));
      parts.push(zoneRect(140, 500, 740, 55));
      parts.push(zoneRect(885, 65, 100, 55));
      parts.push(zoneRect(885, 250, 100, 120));
      parts.push('<rect x="15" y="205" width="60" height="210" rx="10" class="mzone"/><text class="mzone-label" transform="rotate(-90 45 310)" x="45" y="310" text-anchor="middle">SECURITY</text>');
      // gate boxes
      ['A1','A2','A3','A4','A5','A6'].forEach((g, i) => {
        const x = 180 + i * 120;
        parts.push(`<rect x="${x - 26}" y="75" width="52" height="32" rx="8" class="mzone" style="fill:#EAF6FE;stroke:#7DD3FC;cursor:pointer" data-node="g${g}"/><text x="${x}" y="95" text-anchor="middle" font-size="13" font-weight="800" fill="#0369A1" style="pointer-events:none">${g}</text>`);
      });
      ['B7','B8','B9','B10','B11','B12','B13','B14'].forEach((g, i) => {
        const x = 180 + i * 100;
        parts.push(`<rect x="${x - 26}" y="510" width="52" height="32" rx="8" class="mzone" style="fill:#EAF6FE;stroke:#7DD3FC;cursor:pointer" data-node="g${g}"/><text x="${x}" y="530" text-anchor="middle" font-size="13" font-weight="800" fill="#0369A1" style="pointer-events:none">${g}</text>`);
      });
      parts.push('<g stroke="#BAE6FD" stroke-width="1.5" fill="none">' +
        [220,390,480,580,680,760,850,900,930,950].map(x => `<path d="M${x} 285 v50"/>`).join('') + '</g>');
    } else {
      parts.push(zoneRect(180, 70, 640, 110));
      parts.push(zoneRect(240, 200, 520, 70));
      parts.push(zoneRect(120, 395, 740, 50));
      parts.push('<rect x="870" y="90" width="115" height="300" rx="12" class="mzone"/>');
      ['1','2','3','4'].forEach((n, i) => {
        const x = 300 + i * 140;
        parts.push(`<circle cx="${x}" cy="120" r="30" class="mzone" style="fill:#EAF6FE;stroke:#7DD3FC;cursor:pointer" data-node="c${n}"/><text x="${x}" y="125" text-anchor="middle" font-size="13" font-weight="800" fill="#0369A1" style="pointer-events:none">C${n}</text>`);
      });
    }

    // POI markers
    Object.values(NODES).forEach((n) => {
      if (n.level !== level || n.opts.cor || n.opts.gate || n.opts.carousel || n.id === YOUHERE[level]) return;
      const active = destId === n.id;
      const cls = active ? 'mpoi hot' : 'mpoi';
      const labelY = n.y < 200 ? n.y - 20 : n.y + 22;
      const labelAnchor = 'middle';
      parts.push(`<g class="mp" data-node="${n.id}" transform="translate(${n.x},${n.y})">`);
      parts.push(`<g class="${cls}">`);
      parts.push(`<circle class="bg" r="15" cx="0" cy="0"/>`);
      parts.push(`<g transform="translate(-10,-10)">${icon(n.icon, 20)}</g>`);
      parts.push('</g>');
      parts.push(`<text class="mp-label" x="0" y="${labelY - n.y}" text-anchor="${labelAnchor}">${n.label}</text>`);
      parts.push('</g>');
    });

    // Zone labels as pills on top of buttons (never overshadowed)
    const zLabels = level === 'L2'
      ? [ [140, 42, 'PIER A — DEPARTURES'], [140, 588, 'PIER B — DEPARTURES'], [140, 301, 'MAIN CONCOURSE'], [935, 80, 'SKY LOUNGE'], [935, 270, 'GROUND TRANSPORT'] ]
      : [ [500, 52, 'BAGGAGE CLAIM'], [500, 220, 'CUSTOMS · PASSPORT CONTROL'], [150, 411, 'ARRIVALS HALL'], [927, 64, 'GROUND TRANSPORT'] ];
    zLabels.forEach(([x, y, txt]) => parts.push(zoneLabel(x, y, txt)));

    // You are here
    const yh = YOUHERE[level];
    parts.push(`<g class="youhere-marker"><g transform="translate(${NODES[yh].x},${NODES[yh].y})"><circle class="ring" r="11"/><circle r="7"/><circle r="2.6" fill="#fff"/></g><text x="${NODES[yh].x}" y="${NODES[yh].y + 34}" text-anchor="middle" style="pointer-events:none">${t('youhere')} · ${NODES[yh].label}</text></g>`);

    // route
    if (state.route) {
      const seg = state.route.segments.find((s) => s.level === level);
      if (seg && seg.path.length > 1) {
        const pts = seg.path.map((id) => `${NODES[id].x},${NODES[id].y}`);
        const d = 'M' + pts.join(' L');
        parts.push(`<path class="route-glow" d="${d}"/>`);
        parts.push(`<path class="route-path" d="${d}"/>`);
        parts.push(`<circle class="route-travel" r="7"><animateMotion dur="${Math.max(4, metersOf(seg.path) / (WALK * 0.4))}s" repeatCount="indefinite" path="${d}"/></circle>`);
        const end = NODES[seg.path[seg.path.length - 1]];
        parts.push(`<g class="dest-marker"><g transform="translate(${end.x},${end.y})"><circle class="hollow" r="13"/><circle r="7"/><circle r="2.6" fill="#fff"/></g><text x="${end.x}" y="${end.y + 34}" text-anchor="middle">${end.label}</text></g>`);
        if (seg.viaLift) {
          const mid = NODES[seg.path[Math.floor(seg.path.length / 2)]];
          parts.push(`<g transform="translate(${mid.x},${mid.y - 46})"><rect x="-52" y="-14" width="104" height="24" rx="12" fill="#0369A1"/><text x="0" y="4" text-anchor="middle" font-size="11.5" font-weight="800" fill="#fff">LIFT TO ${seg.toLevel}</text></g>`);
        }
      }
    }
    parts.push('</svg>');
    return parts.join('');
  }

  function renderMap(selectDestId) {
    if (selectDestId && NODES[selectDestId]) state.dest = selectDestId;
    $('#mapSvg').innerHTML = buildSvg(state.level, state.dest);
    $('#mapFloorPill').textContent = state.level + ' · ' + (state.level === 'L2' ? t('lvl2') : t('lvl1'));
    $$('.floorbtn').forEach((b) => b.classList.toggle('active', b.dataset.floor === state.level));
    // wire marker clicks
    $$('[data-node]', $('#mapSvg')).forEach((el) => {
      el.addEventListener('click', (e) => { e.stopPropagation(); selectDestination(el.dataset.node); });
      el.style.cursor = 'pointer';
    });
  }

  /* ---------------- destination selection + route card ---------------- */
  function destListItems() {
    return Object.values(NODES).filter((n) => !n.opts.cor).map((n) => ({
      id: n.id, label: n.label, level: n.level, icon: n.icon,
      near: (n.level === state.level) ? Math.round(metersOf([YOUHERE[state.level], n.id])) : null
    }));
  }
  function renderDestList(filter) {
    const list = $('#mapDestList');
    const q = (filter || '').toLowerCase().trim();
    const items = destListItems()
      .filter((it) => !q || it.label.toLowerCase().includes(q) || it.id.toLowerCase().includes(q))
      .sort((a, b) => (a.near === null) - (b.near === null));
    if (!items.length) { list.innerHTML = '<div class="flight-empty" style="padding:20px">No matches — try "Gate B14" or "coffee".</div>'; return; }
    list.innerHTML = items.map((it) => {
      const near = it.near !== null ? `<em>${Math.round(it.near)} m</em>` : `<em style="color:#94A3B8">${it.level}</em>`;
      return `<button class="dest-item ${state.dest === it.id ? 'selected' : ''}" data-dest="${it.id}">
        ${icon(it.icon, 19)}<span class="dest-txt"><strong>${esc(it.label)}</strong><small>${it.level === 'L2' ? t('lvl2') : t('lvl1')}${it.near !== null ? ' · from you' : ''}</small></span>${near}
      </button>`;
    }).join('');
    $$('[data-dest]', list).forEach((b) => b.addEventListener('click', () => selectDestination(b.dataset.dest)));
  }

  function selectDestination(id) {
    const dest = NODES[id];
    if (!dest) return;
    state.dest = id;
    state.level = dest.level;
    // compute route from current-level "you are here"
    const start = YOUHERE[dest.level];
    state.route = route(start, id);
    renderMap(id);
    renderDestList($('#mapSearch').value);

    const card = $('#routeCard');
    card.classList.remove('hidden');
    const total = state.route.segments.reduce((s, sg) => s + metersOf(sg.path), 0);
    $('#routeDestName').textContent = dest.label;
    $('#routeDist').textContent = total < 1000 ? Math.round(total) + ' m' : (total / 1000).toFixed(1) + ' km';
    const mins = Math.round(total / WALK / 60);
    $('#routeTime').textContent = mins + ' min';
    $('#routeCals').textContent = dest.level;
    $('#accessNote').classList.toggle('hidden', !state.access);
    const steps = stepsOf(state.route);
    state.navSteps = steps;
    $('#routeSteps').innerHTML = steps.map((s, i) =>
      `<li><span class="step-num">${i + 1}</span><span>${s.lift ? icon('elev', 15) + ' ' : ''}<b>${s.text}</b></span></li>`).join('');
    if (state.access) {
      const note = $('#accessNoteTxt');
      note.innerHTML = t('accessnote') + (dest.level !== 'L2' && state.level === 'L2' ? ' · Lifts available' : '');
    }
    showView('map');
    speakRoute(steps);
  }

  /* ============================================================
     VIEWS
     ============================================================ */
  function showView(name) {
    const prev = state.view;
    state.view = name;
    $$('.view').forEach((v) => v.classList.toggle('active', v.dataset.view === name));
    $$('.navtab').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
    $('#backHome').classList.toggle('hidden', name === 'home');
    if (name === 'map') { renderMap(); renderDestList($('#mapSearch').value); }
    if (name === 'flights') renderFlights(currentTab, $('#flightSearch').value);
    if (name === 'transport') { renderTransport($('#transportSearch').value); renderIntel(); }
    if (name !== prev) window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  let currentTab = 'dep';

  /* ---------------- home ---------------- */
  const SUGGESTS = [
    { label: 'Gate B14', icon: 'plane', act: () => selectDestination('gB14') },
    { label: 'Flight ZW123', icon: 'plane', act: () => { showView('flights'); $('#flightSearch').value = 'ZW123'; renderFlights(currentTab, 'ZW123'); } },
    { label: 'Coffee', icon: 'coffee', act: () => selectDestination('cafe') },
    { label: 'Restrooms', icon: 'wc', act: () => selectDestination('restrooms') },
    { label: 'Victoria Falls', icon: 'sun', act: () => showView('transport') },
    { label: 'Taxi', icon: 'car', act: () => selectDestination('taxi') }
  ];
  function renderHome() {
    $('#heroSuggest').innerHTML = SUGGESTS.map((s) =>
      `<button class="suggest-chip" data-s="${s.label}">${icon(s.icon, 14)}${esc(s.label)}</button>`).join('');
    $$('[data-s]', $('#heroSuggest')).forEach((b) => {
      const chip = SUGGESTS.find((s) => s.label === b.dataset.s);
      b.addEventListener('click', () => chip.act());
    });
    renderPoiChips();
  }
  function renderPoiChips() {
    const chips = FACILITIES.slice(0, 8);
    $('#poiChips').innerHTML = chips.map((f) => {
      const meta = CAT_META[f.cat];
      const dist = f.distL2 || f.distL1;
      return `<button class="poichip" data-node="${f.n}">${icon(meta.icon, 19)}<span>${meta.label}</span><em>${dist}</em></button>`;
    }).join('');
    $$('[data-node]', $('#poiChips')).forEach((b) => b.addEventListener('click', () => selectDestination(b.dataset.node)));
  }

  /* ---------------- flights ---------------- */
  function renderFlights(tab, q) {
    currentTab = tab;
    $$('.segbtn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    const rows = FLIGHTS[tab].filter((f) => !q || f.code.toLowerCase().includes(q.toLowerCase()) || f.city.toLowerCase().includes(q.toLowerCase()));
    if (!rows.length) { $('#flightBoard').innerHTML = '<div class="flight-empty">No flights match your search.</div>'; return; }
    const dep = tab === 'dep';
    const head = `<div class="board-head">
      <span>${t('f_time')}</span><span>${t('f_flight')}</span><span>${t('f_to')}</span><span>${t('f_gate')}</span><span>${t('f_status')}</span><span>${t('f_bag')}</span>
    </div>`;
    const body = rows.map((f) => {
      const st = STATUS_META[f.status] || STATUS_META.ontime;
      const gateHtml = f.oldGate
        ? `<span class="st-gate changed">${icon('alert', 12)}<span><span class="old">${f.oldGate}</span> → ${f.gate}</span></span>`
        : `<span class="st-gate">${f.gate}</span>`;
      let bagHtml = `<span class="fsmall">${esc(f.bag)}</span>`;
      if (dep && f.pct !== undefined) bagHtml = `<span><span class="fsmall">${esc(f.bag)}</span><div class="boarding-bar"><i style="width:${f.pct}%"></i></div></span>`;
      const gateId = (dep ? 'g' + f.gate : (tab === 'arr' ? 'c' + (f.bag.match(/\d/) ? f.bag.match(/\d/)[0] : '1') : 'g' + f.gate));
      return `<div class="board-row" data-code="${esc(f.code)}" data-gate="${gateId}" data-dep="${dep}">
        <span class="fdate">${f.time}</span><span class="fnum">${esc(f.code)}</span><span class="fcity">${esc(f.city)}</span>
        <span>${gateHtml}</span><span><span class="fstatus ${st.cls}">${st.label}</span></span><span>${bagHtml}</span>
      </div>`;
    }).join('');
    $('#flightBoard').innerHTML = head + body;
    $$('.board-row', $('#flightBoard')).forEach((r) => {
      r.addEventListener('click', () => selectDestination(r.dataset.gate));
    });
  }

  /* ---------------- transport ---------------- */
  function renderTransport(q) {
    const list = TRANSPORT.filter((m) => !q || m.name.toLowerCase().includes(q.toLowerCase()) || m.note.toLowerCase().includes(q.toLowerCase()));
    $('#transportGrid').innerHTML = list.map((m) => `
      <div class="tcard">
        ${m.rec ? '<span class="rec-badge">RECOMMENDED</span>' : ''}
        <div class="t-ico" style="background:${m.color}">${icon(m.icon, 26)}</div>
        <h3>${m.name}</h3>
        <div class="t-meta">
          <span>${icon('clock', 15)} ${m.time}</span>
          <span>${icon('pin', 15)} ${m.zone}</span>
          <span>${icon('bus', 15)} Next: <b>${m.next}</b></span>
        </div>
        <div class="t-price"><b>${m.cost}</b><span>${m.note}</span></div>
        <button class="btn btn-ghost t-card-cta" data-node="${m.id}">Navigate to pick-up point</button>
      </div>`).join('');
    $$('[data-node]', $('#transportGrid')).forEach((b) => b.addEventListener('click', () => selectDestination(b.dataset.node)));
  }
  function renderIntel() {
    $('#intelCards').innerHTML = INTEL.map((c) => `
      <div class="icard" data-city="${esc(c.city)}">
        <div class="i-top"><span class="i-temp">${c.temp}<small>C</small></span>${icon(c.icon, 22)}</div>
        <p>${c.city}</p>
        <div class="i-tags">${c.tags.map((x) => `<i>${x}</i>`).join('')}</div>
      </div>`).join('');
    $$('.icard').forEach((el) => el.addEventListener('click', () => {
      const city = el.dataset.city;
      openAssistant();
      addBotMsg(`<b>${city}</b> — a beautiful destination. Temperature around ${esc(city === 'Kariba' ? '27°C' : city === 'Nyanga' ? '16°C' : '21°C')}. I can show you flight options, hotels and transport. Would you like directions to the Ground Transport desk to arrange the next leg?`);
    }));
  }

  /* ============================================================
     ASSISTANT
     ============================================================ */
  function openAssistant() { $('#assist').classList.add('open'); $('#assist').setAttribute('aria-hidden', 'false'); setTimeout(() => $('#assistInput').focus(), 50); }
  function closeAssistant() { $('#assist').classList.remove('open'); $('#assist').setAttribute('aria-hidden', 'true'); }
  function addMsg(text, who) {
    const body = $('#assistBody');
    const div = document.createElement('div');
    div.className = 'msg ' + who;
    div.innerHTML = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }
  function addBotMsg(text) {
    addMsg('<div class="typing"><i></i><i></i><i></i></div>', 'bot');
    const body = $('#assistBody');
    setTimeout(() => {
      const last = body.lastElementChild;
      if (last) last.remove();
      addMsg(text, 'bot');
      if (state.voice) speak(text.replace(/<[^>]*>/g, ' '));
    }, 700);
  }
  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG === 'fr' ? 'fr-FR' : 'en-GB';
    u.rate = 1.02;
    window.speechSynthesis.speak(u);
  }
  function speakRoute(steps) {
    if (!state.voice || !steps || !steps.length) return;
    speak(`${steps[0].text}. ${steps.length > 1 ? 'More instructions as you go.' : ''}`);
  }
  function navCta(label, nodeId) {
    return `<button class="btn btn-ghost" style="margin-top:10px" data-nav="${nodeId}">${esc(label)}</button>`;
  }
  const CHIPS = [
    'I have 45 minutes before boarding — where can I eat?',
    'Accessible route to Gate B14, please',
    'Check my flight ZW123',
    'Where can I exchange money?',
    'How do I get to the city?'
  ];
  function renderChips() {
    $('#assistChips').innerHTML = CHIPS.map((c) => `<button class="chip" data-chip="${esc(c)}">${esc(c.length > 42 ? c.slice(0, 40) + '…' : c)}</button>`).join('');
    $$('[data-chip]', $('#assistChips')).forEach((b) => b.addEventListener('click', () => { $('#assistInput').value = b.dataset.chip; answer(b.dataset.chip); }));
  }
  function answer(raw) {
    const q = raw.toLowerCase();
    addMsg(raw, 'user');
    $('#assistInput').value = '';

    const m = q.match(/\b(zw\d+|ba\d+|et\d+|kq\d+|sa\d+|ek\d+|ua\d+|fn\d+)\b/i);
    if (m) {
      const f = [...FLIGHTS.dep, ...FLIGHTS.arr].find((x) => x.code.toLowerCase() === m[1].toLowerCase());
      if (f) {
        const st = STATUS_META[f.status];
        addBotMsg(`<b>${f.code}</b> · ${f.city} · departs ${f.time}.<br>Status: <b>${st.label}</b> · Gate <b>${f.gate}</b> · ${esc(f.bag)}.` +
          (f.delay ? `<br><span style="color:#9A3412">Delayed by ${f.delay} minutes.</span>` : '') +
          navCta('Navigate to Gate ' + f.gate, (f.gate[0] === 'A' || f.gate[0] === 'B') ? 'g' + f.gate : 'info'));
        return;
      }
    }
    if (/access|wheelchair|disabl|lift|elevator|stairs/i.test(q)) {
      addBotMsg(`Of course — routing via <b>lifts only</b>, no stairs. From security to <b>Gate B14</b> is about <b>530 m · ~6 min</b>. The route is fully step-free and passes restrooms. I\u2019ve selected accessibility mode for you.` +
        `<br><span style="font-size:12px;opacity:.75">Lifts at the centre of the concourse · 44" wide · tactile guidance along the route.</span>` +
        navCta('Start accessible route', 'gB14'));
      return;
    }
    if (/exchange|money|currency|bank|usd|dollar/i.test(q)) {
      addBotMsg(`Two options on <b>Level 2</b>: the <b>Bank · Currency</b> desk (~6 min walk) and on <b>Level 1 Arrivals</b> the <b>Currency Exchange</b> (~2 min). Both accept USD, EUR, GBP, ZAR and local currency.` +
        navCta('Navigate to Currency Exchange', 'currency') + navCta('Bank on Level 2', 'bank'));
      return;
    }
    if (/\b45\b|minute|minutes|eat|food|hungry|coffee|café|cafe|restaurant|lunch|snack/i.test(q)) {
      addBotMsg(`With <b>45 minutes</b>: the nearest café is <b>2 min</b> from here — a coffee and sandwich takes ~10 min, then <b>6 min</b> back to Gate B14. You\u2019ll be comfortably on time with ~25 min spare.<br><br>The restaurant (4 min) serves full meals; the café (2 min) is quicker.` +
        navCta('Take me to the café', 'cafe'));
      return;
    }
    if (/gate|gedhi|isango/i.test(q)) {
      const g = q.match(/([ab])\s*(\d{1,2})/i);
      const gate = g ? (g[1].toUpperCase() + g[2]) : 'B14';
      addBotMsg(`<b>Gate ${gate}</b> on Level 2 · about <b>${gate === 'B14' ? '530 m · ~6 min' : '400 m · ~5 min'}</b> from security. Walk straight along the Main Concourse and turn right at the B pier.` +
        navCta('Navigate to Gate ' + gate, 'g' + gate));
      return;
    }
    if (/taxi|shuttle|train|bus|rental|transport|city|hotel|get to|leaving/i.test(q)) {
      addBotMsg(`Head to <b>Level 1 · Ground Transport</b>. Taxi (~25 min, $18–$25), City Shuttle ($6, next 14:35) or the Rail Link ($4). The desk also books partner-hotel shuttles.` +
        navCta('Navigate to Ground Transport', 'taxi'));
      return;
    }
    if (/pharmac|pill|medicine|restroom|toilet|wc|lounge|prayer|duty|shop|discover/i.test(q)) {
      const p = /pharmac|pill|medicine/i.test(q) ? 'pharmacy' : /lounge/i.test(q) ? 'lounge' : /prayer/i.test(q) ? 'prayer' : /restroom|toilet|wc/i.test(q) ? 'restrooms' : 'dutyfree';
      const name = { pharmacy: 'Pharmacy', lounge: 'Sky Lounge', prayer: 'Prayer Room', restrooms: 'Restrooms', dutyfree: 'Duty Free' }[p];
      addBotMsg(`Found it — <b>${name}</b> is on Level 2, about <b>${p === 'pharmacy' ? '6' : p === 'lounge' ? '8' : p === 'prayer' ? '5' : p === 'restrooms' ? '5' : '2'} min</b> from you.` + navCta('Navigate to ' + name, p));
      return;
    }
    if (/emergency|exit|evacuat/i.test(q)) {
      addBotMsg(`<b>Emergency guidance:</b> the nearest safe exit is <b>42 m</b> ahead — follow the illuminated route. SkyPath supports airport signage and emergency procedures; please follow staff instructions and illuminated exits.` + navCta('Show nearest exit', 'exit1'));
      return;
    }
    if (/victoria|falls|nyanga|kariba|weather|destination|tour/i.test(q)) {
      addBotMsg(`<b>Victoria Falls</b> — 1 h 10 m away, ~80 km. Flights via FN128 (Gate A4) or a taxi. Hotels & tours are bookable at the <b>Hotel & Tours desk</b> on Level 1.` + navCta('Navigate to Hotel & Tours', 'hotelDesk'));
      return;
    }
    if (/help|what can|hi|hello|hey/i.test(q)) {
      addBotMsg(`Hi! I\u2019m <b>Skylar</b>, the airport AI assistant. Try asking me:<br>• “45 minutes before boarding, where can I eat?”<br>• “Accessible route to Gate B14”<br>• “Check my flight ZW123”<br>• “Where can I exchange money?”`);
      return;
    }
    addBotMsg(`I can help with <b>navigation</b>, <b>flights</b>, <b>facilities</b>, <b>transport</b> and <b>destinations</b>. Try one of the suggestions below, or ask e.g. “how do I get to the city?”`);
  }
  function bindAssistant() {
    $('#assistSend').addEventListener('click', () => { const v = $('#assistInput').value.trim(); if (v) answer(v); });
    $('#assistInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { const v = e.target.value.trim(); if (v) answer(v); } });
    $('#assistClose').addEventListener('click', closeAssistant);
    $('#assistBody').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-nav]');
      if (!btn) return;
      selectDestination(btn.dataset.nav);
      closeAssistant();
      startNavOverlay();
    });
  }

  /* ============================================================
     NAV OVERLAY (walkthrough)
     ============================================================ */
  let navIdx = 0;
  function startNavOverlay() {
    if (!state.navSteps || !state.navSteps.length) return;
    navIdx = 0;
    $('#navOverlay').classList.remove('hidden');
    $('#navOverlay').setAttribute('aria-hidden', 'false');
    $('#backHome').classList.add('hidden');
    $('#navOverlayTitle').textContent = t('navstarted') + ' · ' + t('to') + ' ' + $('#routeDestName').textContent;
    showNavStep();
  }
  function showNavStep() {
    const steps = state.navSteps;
    const s = steps[Math.min(navIdx, steps.length - 1)];
    const dirIco = s.dir === 'elev' ? 'elev' : s.dir === 'right' ? 'right' : s.dir === 'left' ? 'chevR' : s.dir === 'up' ? 'up' : s.dir === 'down' ? 'down' : s.dir === 'pin' ? 'pin' : 'walk';
    const done = navIdx >= steps.length;
    $('#navOverlayStep').innerHTML = `<span class="step-arrow">${icon(dirIco, 24)}</span><span class="step-txt"><b>${done ? t('arrived') : (navIdx + 1) + '/' + steps.length + ' · ' + s.text}</b><span>${done ? $('#routeDestName').textContent : (s.name || '')}</span></span>`;
    $('#navOverlayBar').style.width = Math.min(100, ((navIdx + 1) / Math.max(steps.length, 1)) * 100) + '%';
    $('#navOverlayDest').textContent = $('#routeDestName').textContent;
    $('#navOverlayMeta').textContent = $('#routeTime').textContent + ' · ' + $('#routeDist').textContent;
    if (state.voice && !done) speak(s.text);
  }
  function bindNavOverlay() {
    $('#navOverlayNext').addEventListener('click', () => {
      if (navIdx < state.navSteps.length) navIdx++;
      if (navIdx > state.navSteps.length) { navIdx = state.navSteps.length; }
      showNavStep();
    });
    $('#navOverlayClose').addEventListener('click', () => {
      $('#navOverlay').classList.add('hidden');
      $('#navOverlay').setAttribute('aria-hidden', 'true');
      $('#backHome').classList.toggle('hidden', state.view === 'home');
    });
    $('#navOverlayQr').addEventListener('click', () => { $('#navOverlay').classList.add('hidden'); openQr(); });
  }

  /* ============================================================
     QR (decorative for presentation)
     ============================================================ */
  function buildQrPayload() {
    const dest = state.dest ? (NODES[state.dest] || {}).label || 'Gate B14' : 'Gate B14';
    const level = state.level || 'L2';
    const routeText = `SkyPath|${dest}|${level}|access=${state.access ? '1' : '0'}|voice=${state.voice ? '1' : '0'}`;
    return `https://skypath.app/route?dest=${encodeURIComponent(dest)}&level=${encodeURIComponent(level)}&access=${state.access ? '1' : '0'}&voice=${state.voice ? '1' : '0'}&payload=${encodeURIComponent(routeText)}`;
  }
  function drawQr() {
    const c = $('#qrCanvas'); if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(buildQrPayload())}&size=220x220&format=png&ecc=M`;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, c.width, c.height);
    };
    img.onerror = () => {
      ctx.fillStyle = '#0C4A6E';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('QR unavailable', 46, 112);
    };
    img.src = qrUrl;
  }
  function openQr() {
    drawQr();
    $('#qrModal').classList.add('open');
    $('#qrModal').setAttribute('aria-hidden', 'false');
  }

  /* ============================================================
     CLOCK + TICKER
     ============================================================ */
  function tickClock() {
    const now = new Date();
    $('#clockTime').textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  function renderTicker() {
    const run = TICKER.concat(TICKER).map((s) => `<span>${s}</span>`).join('');
    $('#tickerTrack').innerHTML = run;
  }

  /* ============================================================
     LANGUAGE / ACCESS / VOICE
     ============================================================ */
  function applyLang() {
    document.documentElement.lang = LANG;
    document.documentElement.dir = LANG === 'ar' ? 'rtl' : 'ltr';
    $('#brand-tag').textContent = t('tagline');
    $('#heroTitle').textContent = t('home_title');
    $('#langCode').textContent = LANG.toUpperCase();
    $$('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    $$('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    // rebuild dynamic content
    renderHome(); renderPoiChips(); renderFlights(currentTab, $('#flightSearch').value); renderTransport($('#transportSearch').value); renderIntel();
    if (state.view === 'map') { renderMap(); renderDestList($('#mapSearch').value); }
    if (state.route) { $('#routeDestName').textContent = (NODES[state.dest] || {}).label || ''; }
  }

  /* ============================================================
     TOAST
     ============================================================ */
  let toastTimer;
  function toast(msg, ico) {
    const old = $('.toast'); if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = (ico ? icon(ico, 18) : icon('info', 18)) + '<span>' + esc(msg) + '</span>';
    document.body.appendChild(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.remove(), 3200);
  }

  /* ============================================================
     BINDINGS + INIT
     ============================================================ */
  function bindAll() {
    $$('.navtab').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));
    $$('.quickcard').forEach((b) => {
      b.addEventListener('click', () => { showView(b.dataset.go); });
      b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showView(b.dataset.go); } });
    });

    // language
    $('#langBtn').addEventListener('click', () => {
      $('#langMenu').classList.toggle('open');
      $('#langBtn').setAttribute('aria-expanded', $('#langMenu').classList.contains('open'));
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.topbar-actions') && !e.target.closest('.langmenu')) $('#langMenu').classList.remove('open');
    });
    $$('.langmenu button').forEach((b) => b.addEventListener('click', () => { LANG = b.dataset.lang; $('#langMenu').classList.remove('open'); applyLang(); toast('Language · Ulwimi · Mutauro set to ' + b.dataset.lang.toUpperCase(), 'globe'); }));

    // access + voice
    $('#accessBtn').addEventListener('click', () => {
      state.access = !state.access;
      document.documentElement.dataset.access = state.access;
      $('#accessBtn').classList.toggle('active', state.access);
      $('#accessBtn').setAttribute('aria-pressed', state.access);
      if (state.access) toast('Accessibility mode on — larger text, high contrast, accessible routes', 'wheel');
      renderMap();
    });
    $('#voiceBtn').addEventListener('click', () => {
      state.voice = !state.voice;
      $('#voiceBtn').classList.toggle('active', state.voice);
      $('#voiceBtn').setAttribute('aria-pressed', state.voice);
      if (state.voice) speak('Voice guidance enabled. I will speak your directions.');
      else window.speechSynthesis && window.speechSynthesis.cancel();
      toast(state.voice ? 'Voice guidance on' : 'Voice guidance off', 'mic');
    });

    // assistant
    $('#assistBtn').addEventListener('click', openAssistant);
    bindAssistant();

    // hero search
    const doHeroSearch = () => {
      const q = $('#heroSearch').value.trim().toLowerCase();
      if (!q) return;
      if (q.match(/\b(zw\d+|ba\d+|et\d+|kq\d+|sa\d+|ek\d+|ua\d+|fn\d+)\b/)) { showView('flights'); $('#flightSearch').value = q; renderFlights(currentTab, q); return; }
      if (q.match(/gate|gedhi|isango/) || q.match(/\b[ab]\s?\d{1,2}\b/)) {
        const g = q.match(/([ab])\s?(\d{1,2})/i);
        if (g) selectDestination('g' + g[1].toUpperCase() + g[2]); return;
      }
      const fac = Object.values(NODES).find((n) => n.label.toLowerCase().includes(q) || n.id.includes(q.replace(/\s/g, '')));
      if (fac) { selectDestination(fac.id); return; }
      if (/victoria|falls|kariba|nyanga|zimbabwe|city|hotel|taxi|transport/.test(q)) { showView('transport'); return; }
      toast('Try "Gate B14", "flight ZW123" or "coffee"', 'info');
    };
    $('#heroSearchBtn').addEventListener('click', doHeroSearch);
    $('#heroSearch').addEventListener('keydown', (e) => { if (e.key === 'Enter') doHeroSearch(); });

    // map panel
    $('#mapSearch').addEventListener('input', (e) => renderDestList(e.target.value));
    $$('.floorbtn').forEach((b) => b.addEventListener('click', () => { state.level = b.dataset.floor; renderMap(); renderDestList($('#mapSearch').value); }));
    $('#routeStart').addEventListener('click', startNavOverlay);
    $('#routeStartOver').addEventListener('click', () => { state.route = null; state.dest = null; renderMap(); $('#routeCard').classList.add('hidden'); });
    $('#routeQr').addEventListener('click', openQr);

    // back to home
    const goHome = () => { $('#navOverlay').classList.add('hidden'); $('#navOverlay').setAttribute('aria-hidden', 'true'); showView('home'); };
    $('#backHome').addEventListener('click', goHome);
    $('#routeHome').addEventListener('click', goHome);

    // flights
    $$('.segbtn').forEach((b) => b.addEventListener('click', () => renderFlights(b.dataset.tab, $('#flightSearch').value)));
    $('#flightSearch').addEventListener('input', (e) => renderFlights(currentTab, e.target.value));
    $('#featureNav').addEventListener('click', () => selectDestination('gB14'));
    $('#disruptionNav').addEventListener('click', () => selectDestination('gB14'));

    // transport
    $('#transportSearch').addEventListener('input', (e) => renderTransport(e.target.value));

    // QR
    $('#qrClose').addEventListener('click', () => { $('#qrModal').classList.remove('open'); $('#qrModal').setAttribute('aria-hidden', 'true'); });
    $('#qrDone').addEventListener('click', () => { $('#qrModal').classList.remove('open'); $('#qrModal').setAttribute('aria-hidden', 'true'); });
    $('#qrModal').addEventListener('click', (e) => { if (e.target === $('#qrModal')) { $('#qrModal').classList.remove('open'); } });

    bindNavOverlay();
  }

  function init() {
    if (location.protocol === 'file:') {
      toast('Open the app through a local web server (for example: http://localhost:8000/) for the QR and map features to work correctly.', 'scan');
    }
    renderTicker();
    tickClock(); setInterval(tickClock, 1000);
    renderHome();
    applyLang();
    renderFlights('dep', '');
    renderTransport();
    renderIntel();
    renderMap();
    renderDestList('');
    renderChips();
    bindAll();
    addMsg('Hi, I\u2019m <b>Skylar</b> — your airport assistant. Ask me about gates, flights, food or transport, or tap a suggestion below.', 'bot');
  }

  // expose for console debugging
  window.SkyPath = { state, selectDestination, showView, route, NODES };
  document.addEventListener('DOMContentLoaded', init);
})();
