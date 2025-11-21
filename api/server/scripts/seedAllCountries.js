const mongoose = require('mongoose');
require('dotenv').config();
const Continent = require('../models/Continent');
const Country = require('../models/Country');

// Complete list of all countries with flags organized by continent
const countriesByContinent = {
  'Asia': [
    { name: 'Afghanistan', code: 'AF', flag: '🇦🇫' },
    { name: 'Armenia', code: 'AM', flag: '🇦🇲' },
    { name: 'Azerbaijan', code: 'AZ', flag: '🇦🇿' },
    { name: 'Bahrain', code: 'BH', flag: '🇧🇭' },
    { name: 'Bangladesh', code: 'BD', flag: '🇧🇩' },
    { name: 'Bhutan', code: 'BT', flag: '🇧🇹' },
    { name: 'Brunei', code: 'BN', flag: '🇧🇳' },
    { name: 'Cambodia', code: 'KH', flag: '🇰🇭' },
    { name: 'China', code: 'CN', flag: '🇨🇳' },
    { name: 'Cyprus', code: 'CY', flag: '🇨🇾' },
    { name: 'Georgia', code: 'GE', flag: '🇬🇪' },
    { name: 'India', code: 'IN', flag: '🇮🇳' },
    { name: 'Indonesia', code: 'ID', flag: '🇮🇩' },
    { name: 'Iran', code: 'IR', flag: '🇮🇷' },
    { name: 'Iraq', code: 'IQ', flag: '🇮🇶' },
    { name: 'Israel', code: 'IL', flag: '🇮🇱' },
    { name: 'Japan', code: 'JP', flag: '🇯🇵' },
    { name: 'Jordan', code: 'JO', flag: '🇯🇴' },
    { name: 'Kazakhstan', code: 'KZ', flag: '🇰🇿' },
    { name: 'Kuwait', code: 'KW', flag: '🇰🇼' },
    { name: 'Kyrgyzstan', code: 'KG', flag: '🇰🇬' },
    { name: 'Laos', code: 'LA', flag: '🇱🇦' },
    { name: 'Lebanon', code: 'LB', flag: '🇱🇧' },
    { name: 'Malaysia', code: 'MY', flag: '🇲🇾' },
    { name: 'Maldives', code: 'MV', flag: '🇲🇻' },
    { name: 'Mongolia', code: 'MN', flag: '🇲🇳' },
    { name: 'Myanmar', code: 'MM', flag: '🇲🇲' },
    { name: 'Nepal', code: 'NP', flag: '🇳🇵' },
    { name: 'North Korea', code: 'KP', flag: '🇰🇵' },
    { name: 'Oman', code: 'OM', flag: '🇴🇲' },
    { name: 'Pakistan', code: 'PK', flag: '🇵🇰' },
    { name: 'Palestine', code: 'PS', flag: '🇵🇸' },
    { name: 'Philippines', code: 'PH', flag: '🇵🇭' },
    { name: 'Qatar', code: 'QA', flag: '🇶🇦' },
    { name: 'Russia', code: 'RU', flag: '🇷🇺' },
    { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦' },
    { name: 'Singapore', code: 'SG', flag: '🇸🇬' },
    { name: 'South Korea', code: 'KR', flag: '🇰🇷' },
    { name: 'Sri Lanka', code: 'LK', flag: '🇱🇰' },
    { name: 'Syria', code: 'SY', flag: '🇸🇾' },
    { name: 'Taiwan', code: 'TW', flag: '🇹🇼' },
    { name: 'Tajikistan', code: 'TJ', flag: '🇹🇯' },
    { name: 'Thailand', code: 'TH', flag: '🇹🇭' },
    { name: 'Timor-Leste', code: 'TL', flag: '🇹🇱' },
    { name: 'Turkey', code: 'TR', flag: '🇹🇷' },
    { name: 'Turkmenistan', code: 'TM', flag: '🇹🇲' },
    { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' },
    { name: 'Uzbekistan', code: 'UZ', flag: '🇺🇿' },
    { name: 'Vietnam', code: 'VN', flag: '🇻🇳' },
    { name: 'Yemen', code: 'YE', flag: '🇾🇪' }
  ],
  'Africa': [
    { name: 'Algeria', code: 'DZ', flag: '🇩🇿' },
    { name: 'Angola', code: 'AO', flag: '🇦🇴' },
    { name: 'Benin', code: 'BJ', flag: '🇧🇯' },
    { name: 'Botswana', code: 'BW', flag: '🇧🇼' },
    { name: 'Burkina Faso', code: 'BF', flag: '🇧🇫' },
    { name: 'Burundi', code: 'BI', flag: '🇧🇮' },
    { name: 'Cameroon', code: 'CM', flag: '🇨🇲' },
    { name: 'Cape Verde', code: 'CV', flag: '🇨🇻' },
    { name: 'Central African Republic', code: 'CF', flag: '🇨🇫' },
    { name: 'Chad', code: 'TD', flag: '🇹🇩' },
    { name: 'Comoros', code: 'KM', flag: '🇰🇲' },
    { name: 'Congo', code: 'CG', flag: '🇨🇬' },
    { name: 'DR Congo', code: 'CD', flag: '🇨🇩' },
    { name: 'Djibouti', code: 'DJ', flag: '🇩🇯' },
    { name: 'Egypt', code: 'EG', flag: '🇪🇬' },
    { name: 'Equatorial Guinea', code: 'GQ', flag: '🇬🇶' },
    { name: 'Eritrea', code: 'ER', flag: '🇪🇷' },
    { name: 'Eswatini', code: 'SZ', flag: '🇸🇿' },
    { name: 'Ethiopia', code: 'ET', flag: '🇪🇹' },
    { name: 'Gabon', code: 'GA', flag: '🇬🇦' },
    { name: 'Gambia', code: 'GM', flag: '🇬🇲' },
    { name: 'Ghana', code: 'GH', flag: '🇬🇭' },
    { name: 'Guinea', code: 'GN', flag: '🇬🇳' },
    { name: 'Guinea-Bissau', code: 'GW', flag: '🇬🇼' },
    { name: 'Ivory Coast', code: 'CI', flag: '🇨🇮' },
    { name: 'Kenya', code: 'KE', flag: '🇰🇪' },
    { name: 'Lesotho', code: 'LS', flag: '🇱🇸' },
    { name: 'Liberia', code: 'LR', flag: '🇱🇷' },
    { name: 'Libya', code: 'LY', flag: '🇱🇾' },
    { name: 'Madagascar', code: 'MG', flag: '🇲🇬' },
    { name: 'Malawi', code: 'MW', flag: '🇲🇼' },
    { name: 'Mali', code: 'ML', flag: '🇲🇱' },
    { name: 'Mauritania', code: 'MR', flag: '🇲🇷' },
    { name: 'Mauritius', code: 'MU', flag: '🇲🇺' },
    { name: 'Morocco', code: 'MA', flag: '🇲🇦' },
    { name: 'Mozambique', code: 'MZ', flag: '🇲🇿' },
    { name: 'Namibia', code: 'NA', flag: '🇳🇦' },
    { name: 'Niger', code: 'NE', flag: '🇳🇪' },
    { name: 'Nigeria', code: 'NG', flag: '🇳🇬' },
    { name: 'Rwanda', code: 'RW', flag: '🇷🇼' },
    { name: 'São Tomé and Príncipe', code: 'ST', flag: '🇸🇹' },
    { name: 'Senegal', code: 'SN', flag: '🇸🇳' },
    { name: 'Seychelles', code: 'SC', flag: '🇸🇨' },
    { name: 'Sierra Leone', code: 'SL', flag: '🇸🇱' },
    { name: 'Somalia', code: 'SO', flag: '🇸🇴' },
    { name: 'South Africa', code: 'ZA', flag: '🇿🇦' },
    { name: 'South Sudan', code: 'SS', flag: '🇸🇸' },
    { name: 'Sudan', code: 'SD', flag: '🇸🇩' },
    { name: 'Tanzania', code: 'TZ', flag: '🇹🇿' },
    { name: 'Togo', code: 'TG', flag: '🇹🇬' },
    { name: 'Tunisia', code: 'TN', flag: '🇹🇳' },
    { name: 'Uganda', code: 'UG', flag: '🇺🇬' },
    { name: 'Zambia', code: 'ZM', flag: '🇿🇲' },
    { name: 'Zimbabwe', code: 'ZW', flag: '🇿🇼' }
  ],
  'Europe': [
    { name: 'Albania', code: 'AL', flag: '🇦🇱' },
    { name: 'Andorra', code: 'AD', flag: '🇦🇩' },
    { name: 'Austria', code: 'AT', flag: '🇦🇹' },
    { name: 'Belarus', code: 'BY', flag: '🇧🇾' },
    { name: 'Belgium', code: 'BE', flag: '🇧🇪' },
    { name: 'Bosnia and Herzegovina', code: 'BA', flag: '🇧🇦' },
    { name: 'Bulgaria', code: 'BG', flag: '🇧🇬' },
    { name: 'Croatia', code: 'HR', flag: '🇭🇷' },
    { name: 'Czech Republic', code: 'CZ', flag: '🇨🇿' },
    { name: 'Denmark', code: 'DK', flag: '🇩🇰' },
    { name: 'Estonia', code: 'EE', flag: '🇪🇪' },
    { name: 'Finland', code: 'FI', flag: '🇫🇮' },
    { name: 'France', code: 'FR', flag: '🇫🇷' },
    { name: 'Germany', code: 'DE', flag: '🇩🇪' },
    { name: 'Greece', code: 'GR', flag: '🇬🇷' },
    { name: 'Hungary', code: 'HU', flag: '🇭🇺' },
    { name: 'Iceland', code: 'IS', flag: '🇮🇸' },
    { name: 'Ireland', code: 'IE', flag: '🇮🇪' },
    { name: 'Italy', code: 'IT', flag: '🇮🇹' },
    { name: 'Latvia', code: 'LV', flag: '🇱🇻' },
    { name: 'Liechtenstein', code: 'LI', flag: '🇱🇮' },
    { name: 'Lithuania', code: 'LT', flag: '🇱🇹' },
    { name: 'Luxembourg', code: 'LU', flag: '🇱🇺' },
    { name: 'Malta', code: 'MT', flag: '🇲🇹' },
    { name: 'Moldova', code: 'MD', flag: '🇲🇩' },
    { name: 'Monaco', code: 'MC', flag: '🇲🇨' },
    { name: 'Montenegro', code: 'ME', flag: '🇲🇪' },
    { name: 'Netherlands', code: 'NL', flag: '🇳🇱' },
    { name: 'North Macedonia', code: 'MK', flag: '🇲🇰' },
    { name: 'Norway', code: 'NO', flag: '🇳🇴' },
    { name: 'Poland', code: 'PL', flag: '🇵🇱' },
    { name: 'Portugal', code: 'PT', flag: '🇵🇹' },
    { name: 'Romania', code: 'RO', flag: '🇷🇴' },
    { name: 'San Marino', code: 'SM', flag: '🇸🇲' },
    { name: 'Serbia', code: 'RS', flag: '🇷🇸' },
    { name: 'Slovakia', code: 'SK', flag: '🇸🇰' },
    { name: 'Slovenia', code: 'SI', flag: '🇸🇮' },
    { name: 'Spain', code: 'ES', flag: '🇪🇸' },
    { name: 'Sweden', code: 'SE', flag: '🇸🇪' },
    { name: 'Switzerland', code: 'CH', flag: '🇨🇭' },
    { name: 'Ukraine', code: 'UA', flag: '🇺🇦' },
    { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
    { name: 'Vatican City', code: 'VA', flag: '🇻🇦' }
  ],
  'North America': [
    { name: 'Antigua and Barbuda', code: 'AG', flag: '🇦🇬' },
    { name: 'Bahamas', code: 'BS', flag: '🇧🇸' },
    { name: 'Barbados', code: 'BB', flag: '🇧🇧' },
    { name: 'Belize', code: 'BZ', flag: '🇧🇿' },
    { name: 'Canada', code: 'CA', flag: '🇨🇦' },
    { name: 'Costa Rica', code: 'CR', flag: '🇨🇷' },
    { name: 'Cuba', code: 'CU', flag: '🇨🇺' },
    { name: 'Dominica', code: 'DM', flag: '🇩🇲' },
    { name: 'Dominican Republic', code: 'DO', flag: '🇩🇴' },
    { name: 'El Salvador', code: 'SV', flag: '🇸🇻' },
    { name: 'Grenada', code: 'GD', flag: '🇬🇩' },
    { name: 'Guatemala', code: 'GT', flag: '🇬🇹' },
    { name: 'Haiti', code: 'HT', flag: '🇭🇹' },
    { name: 'Honduras', code: 'HN', flag: '🇭🇳' },
    { name: 'Jamaica', code: 'JM', flag: '🇯🇲' },
    { name: 'Mexico', code: 'MX', flag: '🇲🇽' },
    { name: 'Nicaragua', code: 'NI', flag: '🇳🇮' },
    { name: 'Panama', code: 'PA', flag: '🇵🇦' },
    { name: 'Saint Kitts and Nevis', code: 'KN', flag: '🇰🇳' },
    { name: 'Saint Lucia', code: 'LC', flag: '🇱🇨' },
    { name: 'Saint Vincent and the Grenadines', code: 'VC', flag: '🇻🇨' },
    { name: 'Trinidad and Tobago', code: 'TT', flag: '🇹🇹' },
    { name: 'United States', code: 'US', flag: '🇺🇸' }
  ],
  'South America': [
    { name: 'Argentina', code: 'AR', flag: '🇦🇷' },
    { name: 'Bolivia', code: 'BO', flag: '🇧🇴' },
    { name: 'Brazil', code: 'BR', flag: '🇧🇷' },
    { name: 'Chile', code: 'CL', flag: '🇨🇱' },
    { name: 'Colombia', code: 'CO', flag: '🇨🇴' },
    { name: 'Ecuador', code: 'EC', flag: '🇪🇨' },
    { name: 'Guyana', code: 'GY', flag: '🇬🇾' },
    { name: 'Paraguay', code: 'PY', flag: '🇵🇾' },
    { name: 'Peru', code: 'PE', flag: '🇵🇪' },
    { name: 'Suriname', code: 'SR', flag: '🇸🇷' },
    { name: 'Uruguay', code: 'UY', flag: '🇺🇾' },
    { name: 'Venezuela', code: 'VE', flag: '🇻🇪' }
  ],
  'Australia & Oceania': [
    { name: 'Australia', code: 'AU', flag: '🇦🇺' },
    { name: 'Fiji', code: 'FJ', flag: '🇫🇯' },
    { name: 'Kiribati', code: 'KI', flag: '🇰🇮' },
    { name: 'Marshall Islands', code: 'MH', flag: '🇲🇭' },
    { name: 'Micronesia', code: 'FM', flag: '🇫🇲' },
    { name: 'Nauru', code: 'NR', flag: '🇳🇷' },
    { name: 'New Zealand', code: 'NZ', flag: '🇳🇿' },
    { name: 'Palau', code: 'PW', flag: '🇵🇼' },
    { name: 'Papua New Guinea', code: 'PG', flag: '🇵🇬' },
    { name: 'Samoa', code: 'WS', flag: '🇼🇸' },
    { name: 'Solomon Islands', code: 'SB', flag: '🇸🇧' },
    { name: 'Tonga', code: 'TO', flag: '🇹🇴' },
    { name: 'Tuvalu', code: 'TV', flag: '🇹🇻' },
    { name: 'Vanuatu', code: 'VU', flag: '🇻🇺' }
  ]
};

const seedAllCountries = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://inquiriesesa_db_user:9OOQm5boLEOdNZsi@cluster0.ktqsjbu.mongodb.net/?appName=Cluster0');
    console.log('MongoDB Connected...');

    let totalCreated = 0;
    let totalErrors = 0;

    for (const [continentName, countries] of Object.entries(countriesByContinent)) {
      // Find or create continent
      let continent = await Continent.findOne({ name: continentName });
      if (!continent) {
        const continentCode = continentName === 'Australia & Oceania' ? 'OC' : 
                             continentName === 'North America' ? 'NA' :
                             continentName === 'South America' ? 'SA' :
                             continentName.substring(0, 2).toUpperCase();
        continent = await Continent.create({
          name: continentName,
          code: continentCode,
          description: `${continentName} continent`
        });
        console.log(`✅ Created continent: ${continentName}`);
      }

      // Add countries for this continent
      for (const countryData of countries) {
        try {
          const existing = await Country.findOne({ 
            name: countryData.name,
            continent: continent._id
          });
          
          if (!existing) {
            await Country.create({
              name: countryData.name,
              code: countryData.code,
              continent: continent._id,
              flag: countryData.flag,
              population: 0,
              healthcareIndex: 0
            });
            totalCreated++;
          }
        } catch (error) {
          if (error.code !== 11000) { // Ignore duplicate errors
            console.error(`Error creating ${countryData.name}:`, error.message);
            totalErrors++;
          }
        }
      }
      console.log(`✅ Added countries for ${continentName}`);
    }

    console.log(`\n✅ Successfully seeded ${totalCreated} countries`);
    console.log(`   Errors: ${totalErrors}`);
    
    const totalCountries = await Country.countDocuments({});
    console.log(`   Total countries in database: ${totalCountries}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding countries:', error);
    process.exit(1);
  }
};

seedAllCountries();

