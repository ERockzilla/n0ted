// Country name to ISO 3166-1 alpha-2 code mapping
// Used for displaying country flags

const COUNTRY_CODES: Record<string, string> = {
    // A
    'afghanistan': 'AF',
    'albania': 'AL',
    'algeria': 'DZ',
    'american samoa': 'AS',
    'andorra': 'AD',
    'angola': 'AO',
    'anguilla': 'AI',
    'antigua and barbuda': 'AG',
    'argentina': 'AR',
    'armenia': 'AM',
    'aruba': 'AW',
    'australia': 'AU',
    'austria': 'AT',
    'azerbaijan': 'AZ',
    
    // B
    'bahamas': 'BS',
    'bahamas, the': 'BS',
    'bahrain': 'BH',
    'bangladesh': 'BD',
    'barbados': 'BB',
    'belarus': 'BY',
    'belgium': 'BE',
    'belize': 'BZ',
    'benin': 'BJ',
    'bermuda': 'BM',
    'bhutan': 'BT',
    'bolivia': 'BO',
    'bosnia and herzegovina': 'BA',
    'botswana': 'BW',
    'brazil': 'BR',
    'british virgin islands': 'VG',
    'brunei': 'BN',
    'bulgaria': 'BG',
    'burkina faso': 'BF',
    'burma': 'MM',
    'myanmar': 'MM',
    'burundi': 'BI',
    
    // C
    'cabo verde': 'CV',
    'cape verde': 'CV',
    'cambodia': 'KH',
    'cameroon': 'CM',
    'canada': 'CA',
    'cayman islands': 'KY',
    'central african republic': 'CF',
    'chad': 'TD',
    'chile': 'CL',
    'china': 'CN',
    'colombia': 'CO',
    'comoros': 'KM',
    'congo, democratic republic of the': 'CD',
    'congo, republic of the': 'CG',
    'costa rica': 'CR',
    'cote d\'ivoire': 'CI',
    'ivory coast': 'CI',
    'croatia': 'HR',
    'cuba': 'CU',
    'curacao': 'CW',
    'cyprus': 'CY',
    'czech republic': 'CZ',
    'czechia': 'CZ',
    
    // D
    'denmark': 'DK',
    'djibouti': 'DJ',
    'dominica': 'DM',
    'dominican republic': 'DO',
    
    // E
    'east timor': 'TL',
    'timor-leste': 'TL',
    'ecuador': 'EC',
    'egypt': 'EG',
    'el salvador': 'SV',
    'equatorial guinea': 'GQ',
    'eritrea': 'ER',
    'estonia': 'EE',
    'eswatini': 'SZ',
    'swaziland': 'SZ',
    'ethiopia': 'ET',
    
    // F
    'faroe islands': 'FO',
    'fiji': 'FJ',
    'finland': 'FI',
    'france': 'FR',
    'french guiana': 'GF',
    'french polynesia': 'PF',
    
    // G
    'gabon': 'GA',
    'gambia': 'GM',
    'gambia, the': 'GM',
    'georgia': 'GE',
    'germany': 'DE',
    'ghana': 'GH',
    'gibraltar': 'GI',
    'greece': 'GR',
    'greenland': 'GL',
    'grenada': 'GD',
    'guadeloupe': 'GP',
    'guam': 'GU',
    'guatemala': 'GT',
    'guernsey': 'GG',
    'guinea': 'GN',
    'guinea-bissau': 'GW',
    'guyana': 'GY',
    
    // H
    'haiti': 'HT',
    'honduras': 'HN',
    'hong kong': 'HK',
    'hungary': 'HU',
    
    // I
    'iceland': 'IS',
    'india': 'IN',
    'indonesia': 'ID',
    'iran': 'IR',
    'iraq': 'IQ',
    'ireland': 'IE',
    'isle of man': 'IM',
    'israel': 'IL',
    'italy': 'IT',
    
    // J
    'jamaica': 'JM',
    'japan': 'JP',
    'jersey': 'JE',
    'jordan': 'JO',
    
    // K
    'kazakhstan': 'KZ',
    'kenya': 'KE',
    'kiribati': 'KI',
    'korea, north': 'KP',
    'north korea': 'KP',
    'korea, south': 'KR',
    'south korea': 'KR',
    'kosovo': 'XK',
    'kuwait': 'KW',
    'kyrgyzstan': 'KG',
    
    // L
    'laos': 'LA',
    'latvia': 'LV',
    'lebanon': 'LB',
    'lesotho': 'LS',
    'liberia': 'LR',
    'libya': 'LY',
    'liechtenstein': 'LI',
    'lithuania': 'LT',
    'luxembourg': 'LU',
    
    // M
    'macau': 'MO',
    'macao': 'MO',
    'madagascar': 'MG',
    'malawi': 'MW',
    'malaysia': 'MY',
    'maldives': 'MV',
    'mali': 'ML',
    'malta': 'MT',
    'marshall islands': 'MH',
    'martinique': 'MQ',
    'mauritania': 'MR',
    'mauritius': 'MU',
    'mayotte': 'YT',
    'mexico': 'MX',
    'micronesia, federated states of': 'FM',
    'moldova': 'MD',
    'monaco': 'MC',
    'mongolia': 'MN',
    'montenegro': 'ME',
    'montserrat': 'MS',
    'morocco': 'MA',
    'mozambique': 'MZ',
    
    // N
    'namibia': 'NA',
    'nauru': 'NR',
    'nepal': 'NP',
    'netherlands': 'NL',
    'new caledonia': 'NC',
    'new zealand': 'NZ',
    'nicaragua': 'NI',
    'niger': 'NE',
    'nigeria': 'NG',
    'north macedonia': 'MK',
    'macedonia': 'MK',
    'northern mariana islands': 'MP',
    'norway': 'NO',
    
    // O
    'oman': 'OM',
    
    // P
    'pakistan': 'PK',
    'palau': 'PW',
    'palestine': 'PS',
    'panama': 'PA',
    'papua new guinea': 'PG',
    'paraguay': 'PY',
    'peru': 'PE',
    'philippines': 'PH',
    'poland': 'PL',
    'portugal': 'PT',
    'puerto rico': 'PR',
    
    // Q
    'qatar': 'QA',
    
    // R
    'reunion': 'RE',
    'romania': 'RO',
    'russia': 'RU',
    'rwanda': 'RW',
    
    // S
    'saint kitts and nevis': 'KN',
    'saint lucia': 'LC',
    'saint vincent and the grenadines': 'VC',
    'samoa': 'WS',
    'san marino': 'SM',
    'sao tome and principe': 'ST',
    'saudi arabia': 'SA',
    'senegal': 'SN',
    'serbia': 'RS',
    'seychelles': 'SC',
    'sierra leone': 'SL',
    'singapore': 'SG',
    'sint maarten': 'SX',
    'slovakia': 'SK',
    'slovenia': 'SI',
    'solomon islands': 'SB',
    'somalia': 'SO',
    'south africa': 'ZA',
    'south sudan': 'SS',
    'spain': 'ES',
    'sri lanka': 'LK',
    'sudan': 'SD',
    'suriname': 'SR',
    'sweden': 'SE',
    'switzerland': 'CH',
    'syria': 'SY',
    
    // T
    'taiwan': 'TW',
    'tajikistan': 'TJ',
    'tanzania': 'TZ',
    'thailand': 'TH',
    'togo': 'TG',
    'tonga': 'TO',
    'trinidad and tobago': 'TT',
    'tunisia': 'TN',
    'turkey': 'TR',
    'turkmenistan': 'TM',
    'turks and caicos islands': 'TC',
    'tuvalu': 'TV',
    
    // U
    'uganda': 'UG',
    'ukraine': 'UA',
    'united arab emirates': 'AE',
    'united kingdom': 'GB',
    'united states': 'US',
    'uruguay': 'UY',
    'uzbekistan': 'UZ',
    
    // V
    'vanuatu': 'VU',
    'vatican city': 'VA',
    'holy see': 'VA',
    'venezuela': 'VE',
    'vietnam': 'VN',
    'virgin islands': 'VI',
    
    // W
    'wallis and futuna': 'WF',
    'western sahara': 'EH',
    
    // Y
    'yemen': 'YE',
    
    // Z
    'zambia': 'ZM',
    'zimbabwe': 'ZW',
};

/**
 * Get ISO 3166-1 alpha-2 country code from country name
 */
export function getCountryCode(countryName: string): string | null {
    if (!countryName) return null;
    const normalized = countryName.toLowerCase().trim();
    return COUNTRY_CODES[normalized] || null;
}

/**
 * Get flag URL from country name
 */
export function getFlagUrl(countryName: string, size: '1x1' | '4x3' = '4x3'): string | null {
    const code = getCountryCode(countryName);
    if (!code) return null;
    // country-flag-icons provides SVG flags
    return `https://purecatamphetamine.github.io/country-flag-icons/3x2/${code}.svg`;
}

/**
 * Check if a country has a flag available
 */
export function hasFlag(countryName: string): boolean {
    return getCountryCode(countryName) !== null;
}
