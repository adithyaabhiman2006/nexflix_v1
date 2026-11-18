/* Real titles with sample prices, subscribers and figures for the demo. */

const COUNTRIES = {
  LK: { name: 'Sri Lanka',            siName: 'ශ්‍රී ලංකාව', currency: 'LKR', amount: 299,  methods: ['card', 'voucher', 'dialog'] },
  GB: { name: 'United Kingdom',       siName: 'එක්සත් රාජධානිය', currency: 'GBP', amount: 0.99, methods: ['card'], cookies: true },
  AU: { name: 'Australia',            siName: 'ඕස්ට්‍රේලියාව', currency: 'AUD', amount: 1.49, methods: ['card'] },
  AE: { name: 'United Arab Emirates', siName: 'එක්සත් අරාබි එමීර් රාජ්‍යය', currency: 'USD', amount: 1.49, methods: ['card'] },
  CA: { name: 'Canada',               siName: 'කැනඩාව', currency: 'USD', amount: 1, methods: ['card'] },
  US: { name: 'United States',        siName: 'ඇමරිකා එක්සත් ජනපදය', currency: 'USD', amount: 1, methods: ['card'] },
};

const CATEGORIES = {
  cinema:    { en: 'Cinema',           si: 'සිනමා' },
  teledrama: { en: 'Teledramas',       si: 'ටෙලි නාට්‍ය' },
  dubbed:    { en: 'Sinhala Dubbed',   si: 'සිංහල හඬකැවූ' },
  programme: { en: 'Programmes',       si: 'වැඩසටහන්' },
};

const GENRES = {
  drama: ['Drama', 'නාට්‍ය'], family: ['Family', 'පවුලේ'], romance: ['Romance', 'ප්‍රේම'],
  thriller: ['Thriller', 'ත්‍රාසජනක'], crime: ['Crime', 'අපරාධ'], comedy: ['Comedy', 'හාස්‍ය'],
  history: ['Historical', 'ඓතිහාසික'], action: ['Action', 'ක්‍රියාදාම'], food: ['Food', 'ආහාර'],
  travel: ['Travel', 'සංචාරක'], music: ['Music', 'සංගීත'], quiz: ['Quiz', 'ප්‍රශ්න විචාරාත්මක'],
  kids: ['All ages', 'සැමට'],
};

const TITLES = [];

/* Real Sri Lankan titles, named from their poster artwork (files in assets/posters).
   `year` is left out where it could not be confirmed. Genres are approximate.
   Titles with neither a portrait poster nor banner art are drafts, hidden until one is added.
   Banner titles without a portrait poster appear in the banner and search, not in card rows.
   Runtimes and episode counts are placeholders for the simulated player, except Pravegaya, Moda Tharindu and O.I.C Gadafi. */
const POSTER = id => `assets/posters/${id}.jpg`;
const BANNER = id => `assets/banners/${id}.jpg`;
const TRAILER = id => `assets/trailers/${id}.mp4`;
[
  { id: 'koombiyo', en: 'Koombiyo', si: 'කූඹියෝ', aliases: ['kumbiyo', 'the ants', 'ants'], cat: 'teledrama', year: 2017, genres: ['crime', 'drama'], seasons: [10], mins: 30, poster: POSTER('koombiyo'),
    syn: 'An ITN teledrama directed by Lakmal Dharmarathna, with Thumindu Dodantenna, Kalana Gunasekara and Yureni Noshika.' },
  { id: 'wes', en: 'Wes', si: 'වෙස්', aliases: ['ves', 'wes teledrama'], cat: 'teledrama', year: 2018, genres: ['drama', 'thriller'], seasons: [10], mins: 30, poster: POSTER('wes'),
    syn: 'A Swarnavahini teledrama directed by Dhanushka Rathnayake and produced by Janaka Sampath, with Saranga Disaasekara and Dinakshi Priyasad.' },
  { id: 'sidu', en: 'Sidu', si: 'සිදු', aliases: ['malee 3'], cat: 'teledrama', year: 2016, genres: ['drama', 'family'], seasons: [10], mins: 30, poster: POSTER('sidu'),
    syn: 'A TV Derana teledrama created and directed by Thilina Boralessa.' },
  { id: 'siri-sirimal', en: 'Siri Sirimal', si: 'සිරි සිරිමල්', aliases: ['sirimal'], cat: 'teledrama', year: 2007, genres: ['kids', 'family'], seasons: [10], mins: 19, wide: POSTER('siri-sirimal'),
    syn: 'A Rupavahini children\'s teledrama directed by Sunil Costha, adapted from Mark Twain\'s Tom Sawyer.' },

  { id: 'ayu', en: 'Ayu', si: 'ආයු', aliases: ['aayu'], cat: 'cinema', year: 2025, genres: ['drama', 'family'], mins: 120, poster: POSTER('ayu'),
    syn: '"The story of our lives... entwined." A film by Chathra Weeraman, with Sandra Mack and Jagath Manuwarna.' },
  { id: 'valampuri', en: 'Valampuri', si: 'වාලම්පුරි', aliases: ['walampuri'], cat: 'cinema', genres: ['drama'], mins: 120, poster: POSTER('valampuri'),
    syn: 'A film by Lakmal Dharmarathna, with Thumindu Dodantenna, Dilhani Ekanayaka and Sarath Kothalawala.' },
  { id: 'moda-tharindu', en: 'Moda Tharindu', si: 'මෝඩ තරිඳු', aliases: ['moda tharu', 'modatharindu'], cat: 'cinema', year: 2025, genres: ['comedy'], mins: 120, poster: POSTER('moda-tharindu'),
    syn: 'A comedy horror directed by Thisara Imbulana, with Soorya Dayaruwan in the title role.' },
  { id: 'devi-kusumasana', en: 'Devi Kusumasana', si: 'දේවි කුසුමාසන', aliases: ['kusumasana', 'kusumasana devi'], cat: 'cinema', genres: ['history', 'action'], mins: 120, poster: POSTER('devi-kusumasana'),
    syn: 'A historical film by Jayantha Chandrasiri, from Lyca Productions.' },
  { id: 'passport', en: 'Passport', si: 'පාස්පෝට්', aliases: ['pasport'], cat: 'cinema', year: 2024, genres: ['drama', 'romance'], mins: 120, poster: POSTER('passport'),
    syn: 'A film by Chris Antony, with Jagath Chamila and Dharmapriya Dias.' },
  { id: 'sihina-nelum-mal', en: 'Sihina Nelum Mal', si: 'සිහින නෙළුම් මල්', aliases: ['sihina nelum', 'nelum mal'], cat: 'cinema', year: 2024, genres: ['romance', 'drama'], mins: 120, poster: POSTER('sihina-nelum-mal'),
    syn: 'A romantic drama written and directed by Shameera Rangana Naotunna, with Hemal Ranasinghe.' },
  { id: 'gini-avi-saha-gini-keli', en: 'Gini Avi Saha Gini Keli', si: 'ගිනි අවි සහ ගිනි කෙළි', aliases: ['gini avi', 'gini keli'], cat: 'cinema', year: 1998, genres: ['action', 'crime'], mins: 120, poster: POSTER('gini-avi-saha-gini-keli'),
    syn: 'Directed by Udayakantha Warnasuriya and produced by Ranjith Jayasooriya, with Jackson Anthony, Sriyantha Mendis and Palitha Silva.' },
  { id: 'maya-3d', en: 'Maya 3D', si: 'මායා', aliases: ['maya', 'maaya'], cat: 'cinema', year: 2016, genres: ['thriller'], mins: 120, wide: BANNER('maya-3d'), bannerPos: '50% 12%', trailer: TRAILER('maya-3d'),
    syn: 'Directed by Donald Jayantha. Billed on its poster as Sri Lanka\'s first 3D movie.' },
  { id: 'maariya', en: 'Maariya: The Ocean Angel', si: 'මාරියා', aliases: ['maria', 'mariya', 'ocean angel'], cat: 'cinema', year: 2025, genres: ['thriller', 'drama'], mins: 120, poster: POSTER('maariya'),
    syn: 'A thriller by Aruna Jayawardana, produced by Indrajith Silva, with Hemal Ranasinghe and Mahendra Perera.' },
  { id: 'father', en: 'Father', si: 'ෆාදර්', aliases: ['fadar'], cat: 'cinema', genres: ['action', 'drama'], mins: 120, poster: POSTER('father'),
    syn: 'Directed by Chaminda Jayasuriya and written by Chamara Kodithuwakku.' },
  { id: 'mandara', en: 'Mandara', si: 'මන්දාරා', aliases: ['mandaara'], cat: 'cinema', genres: ['drama'], mins: 120, poster: POSTER('mandara'),
    syn: 'A film by Priyantha Colombage, produced by Mahen Perera, with Bimal Jayakody and Dinakshi Priyasad.' },
  { id: 'goal', en: 'Goal', si: 'ගෝල්', aliases: ['gol', 'football'], cat: 'cinema', genres: ['drama', 'family'], mins: 120, poster: POSTER('goal'),
    syn: 'A football film with Jayalath Manoratne and Chandani Seneviratne.' },
  { id: 'ran-kevita', en: 'Ran Kevita', si: 'රන් කෙවිට', aliases: ['ran kewita'], cat: 'cinema', year: 2007, genres: ['kids', 'family'], mins: 120, poster: POSTER('ran-kevita'),
    syn: 'A children\'s fantasy film directed by Udayakantha Warnasuriya.' },
  { id: 'pravegaya', en: 'Pravegaya', si: 'ප්‍රවේගය', aliases: ['prawegaya', 'pravegeya'], cat: 'cinema', year: 2015, genres: ['action', 'thriller'], mins: 145, wide: BANNER('pravegaya'), bannerPos: '50% 22%', trailer: TRAILER('pravegaya'),
    syn: 'An action thriller directed by Donald Jayantha and produced by R. Sadesh Kumar.' },
  { id: 'thaala', en: 'Thaala', si: 'තාල', aliases: ['tala', 'thala'], cat: 'cinema', genres: ['drama', 'family'], mins: 120, poster: POSTER('thaala'), wide: POSTER('thaala-wide'),
    syn: 'A Sinhala film set among schoolchildren and their teacher.' },
  { id: 'sinhawalokanaya', en: 'Sinhawalokanaya', si: 'සිංහාවලෝකනය', aliases: ['singhawalokanaya', 'the cricket film', 'cricket'], cat: 'cinema', year: 2011, genres: ['drama'], mins: 120, poster: POSTER('sinhawalokanaya'),
    syn: 'The Cricket Film. A sports drama written and directed by Suneth Malinga Lokuhewa.' },
  { id: 'neera', en: 'Neera', si: 'නීරා', aliases: ['nira'], cat: 'cinema', year: 2025, genres: ['romance', 'drama'], mins: 120, poster: POSTER('neera'), wide: POSTER('neera-wide'),
    syn: 'A romantic drama directed by Wasawa Baduge.' },
  { id: 'the-wife', en: 'The Wife', si: 'වයිෆ්', aliases: ['wife', 'waif'], cat: 'cinema', year: 2026, genres: ['crime', 'drama'], mins: 120, wide: BANNER('the-wife'), trailer: TRAILER('the-wife'), bannerPos: '50% 34%',
    syn: 'A gangster drama directed by Shameera Rangana Naotunna, with Hemal Ranasinghe and Udari Warnakulasooriya.' },
  { id: 'rosa-adare', en: 'Rosa Adare', si: 'රෝස ආදරේ', aliases: ['rosa adara', 'rose adare'], cat: 'cinema', year: 2025, genres: ['romance', 'drama'], mins: 120, wide: POSTER('rosa-adare'),
    syn: 'A Sinhala remake of the 2014 Tamil film Naan Sigappu Manithan.' },
  { id: 'jangi-hora', en: 'Jangi Hora', si: 'ජංගි හොරා', aliases: ['underpants thief', 'jangi'], cat: 'cinema', year: 2021, genres: ['drama'], mins: 120, poster: POSTER('jangi-hora'),
    syn: 'Underpants Thief. A Sinhala film that opened in Sri Lankan cinemas in December 2021.' },
  { id: 'oic-gadafi', en: 'O.I.C Gadafi', si: 'ගඩාෆි', aliases: ['oic gadafi', 'gadafi', 'gaddafi', 'oic gaddafi'], cat: 'cinema', year: 2026, genres: ['action', 'crime'], mins: 107, wide: POSTER('oic-gadafi'),
    syn: 'An action film billed on its poster as based on true events.' },
  { id: 'vijayaba-kollaya', en: 'Vijayaba Kollaya', si: 'විජයබා කොල්ලය', aliases: ['vijayabahu kollaya', 'wijayaba kollaya'], cat: 'cinema', year: 2019, genres: ['history', 'drama'], mins: 120, wide: BANNER('vijayaba-kollaya'), trailer: TRAILER('vijayaba-kollaya'), bannerPos: '50% 24%',
    syn: 'A historical drama directed by Sunil Ariyaratne.' },
  { id: 'gajaman', en: 'Gajaman', si: 'ගජමෑන්', aliases: ['gajaman 3d', 'gajamen'], cat: 'cinema', year: 2023, genres: ['comedy', 'kids'], mins: 120, wide: POSTER('gajaman'),
    syn: 'A 3D animated comedy directed by Chanaka Perera.' },
  { id: 'u-turn', en: 'U Turn', si: 'යූ ටර්න්', aliases: ['uturn', 'u-turn'], cat: 'cinema', year: 2019, genres: ['thriller'], mins: 120, poster: POSTER('u-turn'),
    syn: 'A mystery thriller directed by Channa Deshapriya, remade from the 2016 Kannada film.' },
].forEach(ti => TITLES.push(Object.assign({ rating: 'NR', font: 'display', licenceEndDays: 365, rightsHolder: 'To be confirmed', isNew: ti.year >= 2025, status: ti.poster || ti.bannerPos ? 'published' : 'draft' }, ti)));

const RIGHTS_HOLDERS = ['Sample Films (Pvt) Ltd', 'Hill Country Productions', 'Lakwin Teleworks', 'Ocean Gate Media', 'Sarasavi Sample Studio'];

TITLES.forEach((t, i) => {
  t.status = t.status || 'published';
  t.countries = t.countries || ['*'];
  t.rightsHolder = t.rightsHolder || RIGHTS_HOLDERS[i % RIGHTS_HOLDERS.length];
  t.licenceEndDays = t.licenceEndDays != null ? t.licenceEndDays : [22, 180, 365, 540, 95, 730][i % 6];
});

/* Subtitle lines for the simulated player. */
const SUBTITLES = [
  ['Did you see the rain coming over the hills?', 'කඳු උඩින් වැස්ස එනවා දැක්කද?'],
  ['We should leave before the last train.', 'අන්තිම දුම්රියට කලින් අපි යන්න ඕනේ.'],
  ['Mother has been waiting since morning.', 'අම්මා උදේ ඉඳන් බලාගෙන ඉන්නවා.'],
  ['I never told anyone the truth.', 'මම කාටවත් ඇත්ත කිව්වේ නෑ.'],
  ['This house remembers everything.', 'මේ ගෙදර හැමදේම මතක තියාගෙන ඉන්නවා.'],
  ['Tomorrow will be different, you\'ll see.', 'හෙට වෙනස් වෙයි, බලන්නකෝ.'],
  ['Come, the tea is getting cold.', 'එන්න, තේ නිවෙනවා.'],
  ['Who sent you here?', 'ඔයාව මෙහෙට එව්වේ කවුද?'],
  ['Some promises cannot be kept.', 'සමහර පොරොන්දු රකින්න බෑ.'],
  ['Listen. The sea is calling again.', 'අහන්න. මුහුද ආයෙත් අඬගහනවා.'],
];

const CANCEL_REASONS = {
  price: ['It costs too much', 'මිල වැඩියි'],
  content: ['Not enough to watch', 'බලන්න මදි'],
  quality: ['Video or playback problems', 'වීඩියෝ ගැටලු'],
  time: ['I don\'t have time to watch', 'බලන්න වෙලාවක් නෑ'],
  other: ['Something else', 'වෙනත් හේතුවක්'],
};

/* Sample subscribers for the admin panel. */
const SAMPLE_USERS = (() => {
  const first = ['Amaya', 'Dinuka', 'Sachini', 'Kasun', 'Nethmi', 'Tharindu', 'Ishara', 'Ravindu', 'Hasini', 'Chamod', 'Piumi', 'Lahiru', 'Oshadi', 'Sahan', 'Vihangi', 'Nuwan'];
  const last = ['Perera', 'Silva', 'Fernando', 'Jayasuriya', 'Bandara', 'Wijesinghe', 'Dissanayake', 'Gunawardena'];
  const codes = ['LK', 'LK', 'LK', 'GB', 'AU', 'AE', 'CA', 'US'];
  const statuses = ['active', 'active', 'active', 'trial', 'cancelled', 'pending', 'active', 'expired'];
  const methods = { LK: ['Card', 'Voucher', 'Dialog'], other: ['Card'] };
  return Array.from({ length: 48 }, (_, i) => {
    const f = first[i % first.length], l = last[(i * 3) % last.length], c = codes[i % codes.length];
    const pool = c === 'LK' ? methods.LK : methods.other;
    return {
      id: 'U-' + (10240 + i * 37), name: `${f} ${l}`,
      email: `${f}.${l}${i}@example.com`.toLowerCase(), country: c,
      status: statuses[(i * 5) % statuses.length], method: pool[i % pool.length],
      renewsInDays: (i * 7) % 30 + 1,
    };
  });
})();

/* Weekly sign-ups for the admin chart. Sample figures, not a forecast. */
const SAMPLE_SIGNUPS = [
  ['Wk 1', 142], ['Wk 2', 188], ['Wk 3', 231], ['Wk 4', 204],
  ['Wk 5', 276], ['Wk 6', 319], ['Wk 7', 298], ['Wk 8', 364],
];
