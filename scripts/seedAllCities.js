const mongoose = require('mongoose');
require('dotenv').config();
const Country = require('../models/Country');
const Province = require('../models/Province');
const City = require('../models/City');

// Major cities by province/country
// Format: 'Country|Province': [cities]
const citiesByProvince = {
  // Pakistan
  'Pakistan|Punjab': ['Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot', 'Bahawalpur', 'Sargodha', 'Sheikhupura', 'Jhelum', 'Gujrat', 'Kasur', 'Sahiwal', 'Okara', 'Mianwali', 'Chiniot', 'Kamoke', 'Hafizabad', 'Khanewal', 'Burewala'],
  'Pakistan|Sindh': ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpur Khas', 'Jacobabad', 'Shikarpur', 'Dadu', 'Badin', 'Khairpur', 'Tando Allahyar', 'Tando Adam', 'Sanghar', 'Thatta', 'Umerkot', 'Ghotki', 'Naushahro Feroze'],
  'Pakistan|Khyber Pakhtunkhwa': ['Peshawar', 'Mardan', 'Mingora', 'Kohat', 'Abbottabad', 'Dera Ismail Khan', 'Bannu', 'Swabi', 'Nowshera', 'Charsadda', 'Mansehra', 'Haripur', 'Chitral', 'Timergara', 'Tank', 'Karak', 'Hangu', 'Lakki Marwat'],
  'Pakistan|Balochistan': ['Quetta', 'Turbat', 'Khuzdar', 'Chaman', 'Gwadar', 'Dera Murad Jamali', 'Dera Allah Yar', 'Usta Muhammad', 'Loralai', 'Pishin', 'Zhob', 'Sibi', 'Kalat', 'Mastung', 'Nushki', 'Panjgur', 'Tump', 'Hub'],
  'Pakistan|Gilgit-Baltistan': ['Gilgit', 'Skardu', 'Hunza', 'Chilas', 'Astore', 'Ghanche', 'Shigar', 'Kharmang', 'Nagar', 'Diamer'],
  'Pakistan|Azad Jammu and Kashmir': ['Muzaffarabad', 'Mirpur', 'Kotli', 'Rawalakot', 'Bhimber', 'Bagh', 'Hattian', 'Neelum', 'Poonch', 'Sudhnuti'],
  'Pakistan|Islamabad Capital Territory': ['Islamabad', 'Rawalpindi'],

  // India - Major cities for key states
  'India|Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Aurangabad', 'Nashik', 'Solapur', 'Amravati', 'Kolhapur', 'Sangli', 'Satara', 'Jalgaon', 'Akola', 'Latur', 'Ahmednagar', 'Chandrapur', 'Parbhani', 'Ichalkaranji', 'Jalna', 'Bhusawal', 'Panvel'],
  'India|Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad', 'Meerut', 'Ghaziabad', 'Noida', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Faizabad', 'Jhansi', 'Mathura', 'Firozabad', 'Shahjahanpur', 'Rampur', 'Muzaffarnagar'],
  'India|Delhi': ['New Delhi', 'Delhi'],
  'India|Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Anand', 'Bharuch', 'Junagadh', 'Navsari', 'Porbandar', 'Mehsana', 'Gandhidham', 'Valsad', 'Palanpur', 'Patan', 'Surendranagar'],
  'India|Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davangere', 'Shimoga', 'Bijapur', 'Raichur', 'Tumkur', 'Udupi', 'Bellary', 'Chitradurga', 'Hassan', 'Mandya', 'Bidar', 'Chamrajnagar'],
  'India|Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Dindigul', 'Thanjavur', 'Tuticorin', 'Kanchipuram', 'Nagercoil', 'Karur', 'Hosur', 'Neyveli', 'Cuddalore', 'Sivakasi'],
  'India|West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Kharagpur', 'Haldia', 'Jalpaiguri', 'Krishnanagar', 'Berhampore', 'Raiganj', 'Balurghat', 'Bankura', 'Cooch Behar', 'Darjeeling', 'Alipurduar'],
  'India|Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Sikar', 'Tonk', 'Pali', 'Bharatpur', 'Sri Ganganagar', 'Baran', 'Chittorgarh', 'Jhunjhunu', 'Nagaur', 'Dausa'],
  'India|Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Ratlam', 'Satna', 'Rewa', 'Murwara', 'Singrauli', 'Chhindwara', 'Dewas', 'Khandwa', 'Burhanpur', 'Neemuch', 'Morena', 'Bhind'],
  'India|Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Pathankot', 'Hoshiarpur', 'Moga', 'Abohar', 'Malerkotla', 'Khanna', 'Mohali', 'Firozpur', 'Phagwara', 'Batala', 'Muktsar', 'Barnala'],
  'India|Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Karnal', 'Hisar', 'Rohtak', 'Panchkula', 'Sonipat', 'Sirsa', 'Bhiwani', 'Jind', 'Kaithal', 'Palwal', 'Rewari', 'Bahadurgarh', 'Thanesar'],
  'India|Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha', 'Kannur', 'Kottayam', 'Palakkad', 'Manjeri', 'Thalassery', 'Kasaragod', 'Pathanamthitta', 'Idukki', 'Wayanad', 'Malappuram', 'Ernakulam', 'Kannur'],
  'India|Andhra Pradesh': ['Hyderabad', 'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Rajahmundry', 'Kurnool', 'Kadapa', 'Tirupati', 'Anantapur', 'Eluru', 'Ongole', 'Nizamabad', 'Machilipatnam', 'Adoni', 'Tenali', 'Chittoor', 'Hindupur'],
  'India|Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Bettiah', 'Saharsa', 'Hajipur', 'Sasaram', 'Dehri', 'Siwan', 'Motihari'],
  'India|Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Baleshwar', 'Bhadrak', 'Baripada', 'Jharsuguda', 'Rayagada', 'Jeypore', 'Bargarh', 'Kendujhar', 'Balangir', 'Phulbani', 'Koraput', 'Ganjam'],
  'India|Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Karimganj', 'Sivasagar', 'Barpeta', 'Goalpara', 'Dhubri', 'Kokrajhar', 'North Lakhimpur', 'Mangaldoi', 'Diphu', 'Hailakandi'],
  'India|Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro Steel City', 'Hazaribagh', 'Deoghar', 'Giridih', 'Phusro', 'Ramgarh', 'Medininagar', 'Chaibasa', 'Gumla', 'Lohardaga', 'Simdega', 'Pakur', 'Sahebganj', 'Godda', 'Dumka'],
  'India|Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Raigarh', 'Jagdalpur', 'Ambikapur', 'Durg', 'Rajnandgaon', 'Dhamtari', 'Mahasamund', 'Kanker', 'Kawardha', 'Janjgir', 'Mungeli', 'Baloda Bazar', 'Gariaband', 'Kondagaon'],
  'India|Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Nainital', 'Almora', 'Pithoragarh', 'Chamoli', 'Pauri', 'Tehri', 'Uttarkashi', 'Champawat', 'Bageshwar', 'Udham Singh Nagar', 'Chamoli'],
  'India|Himachal Pradesh': ['Shimla', 'Solan', 'Dharamshala', 'Mandi', 'Bilaspur', 'Kullu', 'Chamba', 'Kangra', 'Una', 'Hamirpur', 'Nahan', 'Palampur', 'Sundarnagar', 'Nurpur', 'Kasauli', 'Dalhousie', 'Manali', 'Kasauli'],
  'India|Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Mormugao', 'Curchorem', 'Bicholim', 'Valpoi', 'Canacona', 'Sanguem', 'Quepem', 'Pernem', 'Sattari', 'Tiswadi', 'Bardez', 'Salcete', 'Mormugao'],
  'India|Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailasahar', 'Belonia', 'Khowai', 'Teliamura', 'Amarpur', 'Sabroom', 'Kumarghat', 'Ambassa', 'Kamalpur', 'Sonamura', 'Bishalgarh', 'Melaghar', 'Jirania', 'Dukli', 'Jampuijala'],
  'India|Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Ukhrul', 'Senapati', 'Tamenglong', 'Chandel', 'Kangpokpi', 'Jiribam', 'Kakching', 'Lilong', 'Mayang Imphal', 'Moirang', 'Nambol', 'Oinam', 'Sekmai', 'Wangjing'],
  'India|Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongpoh', 'Baghmara', 'Williamnagar', 'Resubelpara', 'Ampati', 'Mairang', 'Mawkyrwat', 'Nongstoin', 'Mawphlang', 'Mawryngkneng', 'Pynursla', 'Sohra', 'Mawsynram', 'Khliehriat', 'Nongpoh'],
  'India|Mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib', 'Serchhip', 'Lawngtlai', 'Mamit', 'Khawzawl', 'Hnahthial', 'Saitual', 'Khawhai', 'Thenzawl', 'Vairengte', 'Darlawn', 'Biate', 'Tlabung', 'Zawlnuam'],
  'India|Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Phek', 'Mon', 'Kiphire', 'Longleng', 'Peren', 'Noklak', 'Tseminyu', 'Chumukedima', 'Medziphema', 'Jalukie', 'Pfutsero', 'Meluri'],
  'India|Sikkim': ['Gangtok', 'Namchi', 'Mangan', 'Gyalshing', 'Singtam', 'Rangpo', 'Jorethang', 'Pakyong', 'Ravangla', 'Lachung', 'Lachen', 'Pelling', 'Yuksom', 'Rumtek', 'Temi', 'Rhenock', 'Rongli', 'Melli'],
  'India|Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Tawang', 'Bomdila', 'Ziro', 'Pasighat', 'Tezu', 'Roing', 'Daporijo', 'Along', 'Aalo', 'Yingkiong', 'Anini', 'Khonsa', 'Longding', 'Changlang', 'Namsai', 'Hayuliang'],

  // United States - Major cities for key states
  'California': ['Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Fresno', 'Sacramento', 'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim', 'Santa Ana', 'Riverside', 'Stockton', 'Irvine', 'Chula Vista', 'Fremont', 'San Bernardino', 'Modesto', 'Fontana', 'Oxnard'],
  'Texas': ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Laredo', 'Lubbock', 'Garland', 'Irving', 'Amarillo', 'Grand Prairie', 'Brownsville', 'McKinney', 'Frisco', 'Pasadena', 'Killeen'],
  'New York': ['New York City', 'Buffalo', 'Rochester', 'Albany', 'Syracuse', 'Yonkers', 'Utica', 'New Rochelle', 'Mount Vernon', 'Schenectady', 'White Plains', 'Hempstead', 'Troy', 'Niagara Falls', 'Binghamton', 'Freeport', 'Valley Stream', 'Rome'],
  'Florida': ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah', 'Tallahassee', 'Fort Lauderdale', 'Port St. Lucie', 'Cape Coral', 'Pembroke Pines', 'Hollywood', 'Miramar', 'Gainesville', 'Coral Springs', 'Miami Gardens', 'Clearwater', 'Palm Bay'],
  'Illinois': ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville', 'Springfield', 'Peoria', 'Elgin', 'Waukegan', 'Cicero', 'Champaign', 'Bloomington', 'Arlington Heights', 'Evanston', 'Decatur', 'Schaumburg', 'Bolingbrook', 'Palatine'],
  'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton', 'Bethlehem', 'Lancaster', 'Harrisburg', 'Altoona', 'York', 'State College', 'Wilkes-Barre', 'Chester', 'Williamsport', 'Johnstown', 'Washington', 'Monroeville'],
  'Ohio': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton', 'Parma', 'Canton', 'Youngstown', 'Lorain', 'Hamilton', 'Springfield', 'Kettering', 'Elyria', 'Lakewood', 'Cuyahoga Falls', 'Middletown', 'Newark'],
  'Michigan': ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Lansing', 'Ann Arbor', 'Flint', 'Dearborn', 'Livonia', 'Troy', 'Westland', 'Farmington Hills', 'Kalamazoo', 'Wyoming', 'Southfield', 'Rochester Hills', 'Taylor', 'St. Clair Shores'],
  'Georgia': ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens', 'Sandy Springs', 'Roswell', 'Macon', 'Johns Creek', 'Albany', 'Warner Robins', 'Alpharetta', 'Marietta', 'Valdosta', 'Smyrna', 'Dunwoody', 'Rome', 'East Point'],
  'North Carolina': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville', 'Cary', 'Wilmington', 'High Point', 'Concord', 'Asheville', 'Gastonia', 'Jacksonville', 'Chapel Hill', 'Rocky Mount', 'Burlington', 'Wilson', 'Huntersville'],
  'Arizona': ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale', 'Gilbert', 'Tempe', 'Peoria', 'Surprise', 'Yuma', 'Avondale', 'Flagstaff', 'Goodyear', 'Lake Havasu City', 'Buckeye', 'Casa Grande', 'Sierra Vista'],
  'Washington': ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Everett', 'Kent', 'Yakima', 'Renton', 'Spokane Valley', 'Federal Way', 'Bellingham', 'Kennewick', 'Auburn', 'Pasco', 'Marysville', 'Lakewood', 'Redmond'],
  'Massachusetts': ['Boston', 'Worcester', 'Springfield', 'Lowell', 'Cambridge', 'New Bedford', 'Brockton', 'Quincy', 'Lynn', 'Fall River', 'Newton', 'Lawrence', 'Somerville', 'Framingham', 'Haverhill', 'Waltham', 'Malden', 'Brookline'],
  'Indiana': ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel', 'Fishers', 'Bloomington', 'Hammond', 'Gary', 'Muncie', 'Terre Haute', 'Kokomo', 'Anderson', 'Noblesville', 'Greenwood', 'Elkhart', 'Mishawaka', 'Lafayette'],
  'Tennessee': ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville', 'Murfreesboro', 'Franklin', 'Jackson', 'Johnson City', 'Bartlett', 'Hendersonville', 'Kingsport', 'Collierville', 'Smyrna', 'Brentwood', 'Germantown', 'Columbia', 'Spring Hill'],
  'Missouri': ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence', 'Lee\'s Summit', 'O\'Fallon', 'St. Joseph', 'St. Charles', 'St. Peters', 'Blue Springs', 'Florissant', 'Joplin', 'Chesterfield', 'Jefferson City', 'Cape Girardeau', 'Oakville', 'Wildwood'],
  'Maryland': ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg', 'Bowie', 'Annapolis', 'College Park', 'Salisbury', 'Laurel', 'Greenbelt', 'Cumberland', 'Westminster', 'Hagerstown', 'Hyattsville', 'Takoma Park', 'Easton', 'Elkton', 'Cambridge'],
  'Wisconsin': ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine', 'Appleton', 'Waukesha', 'Oshkosh', 'Eau Claire', 'Janesville', 'West Allis', 'La Crosse', 'Sheboygan', 'Wauwatosa', 'Fond du Lac', 'Neenah', 'Beloit', 'Stevens Point'],
  'Colorado': ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood', 'Thornton', 'Arvada', 'Westminster', 'Pueblo', 'Centennial', 'Boulder', 'Greeley', 'Longmont', 'Loveland', 'Grand Junction', 'Broomfield', 'Commerce City', 'Northglenn'],
  'Minnesota': ['Minneapolis', 'St. Paul', 'Rochester', 'Duluth', 'Bloomington', 'Brooklyn Park', 'Plymouth', 'St. Cloud', 'Eagan', 'Woodbury', 'Maple Grove', 'Eden Prairie', 'Coon Rapids', 'Burnsville', 'Blaine', 'Lakeville', 'Minnetonka', 'Apple Valley'],
  'South Carolina': ['Charleston', 'Columbia', 'North Charleston', 'Mount Pleasant', 'Rock Hill', 'Greenville', 'Summerville', 'Sumter', 'Hilton Head Island', 'Spartanburg', 'Florence', 'Aiken', 'Myrtle Beach', 'Anderson', 'Greer', 'Taylors', 'Goose Creek', 'Hanahan'],
  'Alabama': ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Tuscaloosa', 'Hoover', 'Dothan', 'Auburn', 'Decatur', 'Madison', 'Florence', 'Gadsden', 'Vestavia Hills', 'Prattville', 'Phenix City', 'Opelika', 'Anniston', 'Bessemer'],
  'Louisiana': ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles', 'Kenner', 'Bossier City', 'Monroe', 'Alexandria', 'Houma', 'Marrero', 'Central', 'Laplace', 'New Iberia', 'Slidell', 'Chalmette', 'Harvey', 'Ruston'],
  'Kentucky': ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington', 'Hopkinsville', 'Richmond', 'Florence', 'Georgetown', 'Henderson', 'Elizabethtown', 'Nicholasville', 'Jeffersontown', 'Frankfort', 'Paducah', 'Radcliff', 'Ashland', 'Madisonville'],
  'Oregon': ['Portland', 'Eugene', 'Salem', 'Gresham', 'Hillsboro', 'Bend', 'Beaverton', 'Medford', 'Springfield', 'Corvallis', 'Albany', 'Tigard', 'Lake Oswego', 'Keizer', 'Grants Pass', 'Oregon City', 'McMinnville', 'Redmond'],
  'Oklahoma': ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Lawton', 'Edmond', 'Moore', 'Midwest City', 'Enid', 'Stillwater', 'Muskogee', 'Bartlesville', 'Owasso', 'Shawnee', 'Ponca City', 'Ardmore', 'Duncan', 'McAlester'],
  'Connecticut': ['Bridgeport', 'New Haven', 'Hartford', 'Stamford', 'Waterbury', 'Norwalk', 'Danbury', 'New Britain', 'West Hartford', 'Greenwich', 'Hamden', 'Meriden', 'Bristol', 'Milford', 'West Haven', 'Middletown', 'Norwich', 'Shelton'],
  'Iowa': ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City', 'Waterloo', 'Council Bluffs', 'Ames', 'West Des Moines', 'Dubuque', 'Ankeny', 'Urbandale', 'Cedar Falls', 'Marion', 'Bettendorf', 'Mason City', 'Marshalltown', 'Ottumwa'],
  'Mississippi': ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi', 'Meridian', 'Tupelo', 'Greenville', 'Olive Branch', 'Horn Lake', 'Clinton', 'Madison', 'Pearl', 'Ridgeland', 'Starkville', 'Columbus', 'Vicksburg', 'Pascagoula'],
  'Arkansas': ['Little Rock', 'Fort Smith', 'Fayetteville', 'Jonesboro', 'North Little Rock', 'Conway', 'Rogers', 'Pine Bluff', 'Bentonville', 'Hot Springs', 'Texarkana', 'Springdale', 'Cabot', 'Searcy', 'Van Buren', 'El Dorado', 'Batesville', 'Paragould'],
  'Kansas': ['Wichita', 'Overland Park', 'Kansas City', 'Olathe', 'Topeka', 'Lawrence', 'Shawnee', 'Manhattan', 'Lenexa', 'Salina', 'Hutchinson', 'Leavenworth', 'Leawood', 'Dodge City', 'Garden City', 'Emporia', 'Derby', 'Prairie Village'],
  'Utah': ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem', 'Sandy', 'Ogden', 'St. George', 'Layton', 'Taylorsville', 'South Jordan', 'Lehi', 'Logan', 'Murray', 'Draper', 'Bountiful', 'Riverton', 'Roy'],
  'Nevada': ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks', 'Carson City', 'Fernley', 'Elko', 'Mesquite', 'Boulder City', 'Fallon', 'Winnemucca', 'West Wendover', 'Ely', 'Yerington', 'Caliente', 'Lovelock', 'Wells'],
  'New Mexico': ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell', 'Farmington', 'Clovis', 'Hobbs', 'Alamogordo', 'Carlsbad', 'Gallup', 'Deming', 'Los Alamos', 'Portales', 'Chaparral', 'Sunland Park', 'Las Vegas', 'Silver City'],
  'West Virginia': ['Charleston', 'Huntington', 'Parkersburg', 'Morgantown', 'Wheeling', 'Martinsburg', 'Fairmont', 'Beckley', 'Clarksburg', 'South Charleston', 'St. Albans', 'Vienna', 'Hurricane', 'Bridgeport', 'Keyser', 'Lewisburg', 'Buckhannon', 'Elkins'],
  'Nebraska': ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney', 'Fremont', 'Hastings', 'North Platte', 'Norfolk', 'Columbus', 'Papillion', 'La Vista', 'Scottsbluff', 'South Sioux City', 'Beatrice', 'Chalco', 'McCook', 'York'],
  'Idaho': ['Boise', 'Nampa', 'Meridian', 'Idaho Falls', 'Pocatello', 'Caldwell', 'Coeur d\'Alene', 'Twin Falls', 'Lewiston', 'Post Falls', 'Rexburg', 'Chubbuck', 'Moscow', 'Eagle', 'Kuna', 'Ammon', 'Hayden', 'Mountain Home'],
  'Hawaii': ['Honolulu', 'East Honolulu', 'Pearl City', 'Hilo', 'Kailua', 'Kaneohe', 'Kahului', 'Ewa Gentry', 'Mililani Town', 'Kihei', 'Makakilo', 'Waipahu', 'Schofield Barracks', 'Royal Kunia', 'Waimalu', 'Waianae', 'Nanakuli', 'Lahaina'],
  'New Hampshire': ['Manchester', 'Nashua', 'Concord', 'Derry', 'Rochester', 'Dover', 'Salem', 'Merrimack', 'Londonderry', 'Hudson', 'Keene', 'Bedford', 'Portsmouth', 'Goffstown', 'Hampton', 'Milford', 'Durham', 'Exeter'],
  'Maine': ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn', 'Biddeford', 'Saco', 'Sanford', 'Augusta', 'Westbrook', 'Waterville', 'Presque Isle', 'Caribou', 'Ellsworth', 'Orono', 'Old Orchard Beach', 'Brewer', 'Gorham'],
  'Rhode Island': ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence', 'Woonsocket', 'Newport', 'Central Falls', 'Westerly', 'Cumberland', 'North Providence', 'South Kingstown', 'Barrington', 'Middletown', 'Portsmouth', 'Tiverton', 'Lincoln', 'Smithfield'],
  'Montana': ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte', 'Helena', 'Kalispell', 'Havre', 'Anaconda', 'Miles City', 'Belgrade', 'Livingston', 'Laurel', 'Whitefish', 'Lewistown', 'Sidney', 'Glendive', 'Hamilton'],
  'Delaware': ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna', 'Milford', 'Seaford', 'Georgetown', 'Elsmere', 'New Castle', 'Laurel', 'Harrington', 'Camden', 'Clayton', 'Lewes', 'Rehoboth Beach', 'Bridgeville', 'Delmar'],
  'South Dakota': ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Watertown', 'Brookings', 'Mitchell', 'Yankton', 'Pierre', 'Huron', 'Vermillion', 'Spearfish', 'Madison', 'Sturgis', 'Belle Fourche', 'Hot Springs', 'Lead', 'Deadwood', 'Custer'],
  'North Dakota': ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo', 'Williston', 'Dickinson', 'Mandan', 'Jamestown', 'Wahpeton', 'Devils Lake', 'Valley City', 'Grafton', 'Beulah', 'Rugby', 'Hazen', 'Carrington', 'Watford City'],
  'Alaska': ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Ketchikan', 'Wasilla', 'Kenai', 'Kodiak', 'Bethel', 'Palmer', 'Homer', 'Barrow', 'Nome', 'Unalaska', 'Valdez', 'Soldotna', 'Kotzebue', 'Seward'],
  'Vermont': ['Burlington', 'Essex', 'South Burlington', 'Colchester', 'Rutland', 'Montpelier', 'Barre', 'St. Albans', 'Winooski', 'Brattleboro', 'Milton', 'Hartford', 'Williston', 'Middlebury', 'Bennington', 'Shelburne', 'Swanton', 'Springfield'],
  'Wyoming': ['Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs', 'Sheridan', 'Green River', 'Evanston', 'Riverton', 'Jackson', 'Cody', 'Rawlins', 'Lander', 'Torrington', 'Powell', 'Douglas', 'Worland', 'Buffalo'],

  // Canada
  'Ontario': ['Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton', 'London', 'Markham', 'Vaughan', 'Kitchener', 'Windsor', 'Richmond Hill', 'Burlington', 'Sudbury', 'Oshawa', 'Barrie', 'St. Catharines', 'Guelph', 'Cambridge', 'Thunder Bay', 'Waterloo'],
  'Quebec': ['Montreal', 'Quebec City', 'Laval', 'Gatineau', 'Longueuil', 'Sherbrooke', 'Saguenay', 'Lévis', 'Trois-Rivières', 'Terrebonne', 'Saint-Jean-sur-Richelieu', 'Repentigny', 'Brossard', 'Drummondville', 'Saint-Jérôme', 'Granby', 'Blainville', 'Saint-Hyacinthe'],
  'British Columbia': ['Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Langley', 'Abbotsford', 'Coquitlam', 'Kelowna', 'Saanich', 'Delta', 'Nanaimo', 'Kamloops', 'North Vancouver', 'Chilliwack', 'Victoria', 'Maple Ridge', 'New Westminster', 'Port Coquitlam'],
  'Alberta': ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'St. Albert', 'Medicine Hat', 'Grande Prairie', 'Airdrie', 'Spruce Grove', 'Okotoks', 'Fort McMurray', 'Leduc', 'Camrose', 'Cochrane', 'Fort Saskatchewan', 'Brooks', 'Cold Lake', 'Canmore'],
  'Manitoba': ['Winnipeg', 'Brandon', 'Steinbach', 'Thompson', 'Portage la Prairie', 'Winkler', 'Selkirk', 'Dauphin', 'Morden', 'Flin Flon', 'The Pas', 'Swan River', 'Altona', 'Virden', 'Neepawa', 'Beausejour', 'Carberry', 'Gimli'],
  'Saskatchewan': ['Saskatoon', 'Regina', 'Prince Albert', 'Moose Jaw', 'Swift Current', 'Yorkton', 'North Battleford', 'Estevan', 'Weyburn', 'Melfort', 'Melville', 'Lloydminster', 'Martensville', 'Warman', 'Humboldt', 'Kindersley', 'Meadow Lake', 'Tisdale'],
  'Nova Scotia': ['Halifax', 'Dartmouth', 'Sydney', 'Truro', 'New Glasgow', 'Glace Bay', 'Kentville', 'Amherst', 'Bridgewater', 'Yarmouth', 'Lunenburg', 'Wolfville', 'Antigonish', 'Pictou', 'Liverpool', 'Digby', 'Shelburne', 'Windsor'],
  'New Brunswick': ['Saint John', 'Moncton', 'Fredericton', 'Dieppe', 'Miramichi', 'Edmundston', 'Riverview', 'Quispamsis', 'Bathurst', 'Campbellton', 'Sackville', 'Oromocto', 'Grand Falls', 'Shippagan', 'Caraquet', 'Bouctouche', 'Shediac', 'Dalhousie'],
  'Newfoundland and Labrador': ['St. John\'s', 'Mount Pearl', 'Corner Brook', 'Conception Bay South', 'Grand Falls-Windsor', 'Gander', 'Happy Valley-Goose Bay', 'Labrador City', 'Stephenville', 'Marystown', 'Deer Lake', 'Carbonear', 'Bay Roberts', 'Clarenville', 'Channel-Port aux Basques', 'Bonavista', 'Lewisporte', 'Placentia'],
  'Prince Edward Island': ['Charlottetown', 'Summerside', 'Stratford', 'Cornwall', 'Montague', 'Kensington', 'Souris', 'Alberton', 'Tignish', 'Georgetown', 'O\'Leary', 'Wellington', 'Rustico', 'Borden-Carleton', 'Crapaud', 'Murray River', 'Morell', 'Souris'],
  'Northwest Territories': ['Yellowknife', 'Hay River', 'Inuvik', 'Fort Smith', 'Behchokò', 'Fort Simpson', 'Tuktoyaktuk', 'Norman Wells', 'Fort McPherson', 'Aklavik', 'Délı̨nę', 'Fort Providence', 'Fort Resolution', 'Lutselk\'e', 'Nahanni Butte', 'Sachs Harbour', 'Tsiigehtchic', 'Ulukhaktok'],
  'Nunavut': ['Iqaluit', 'Rankin Inlet', 'Arviat', 'Baker Lake', 'Cambridge Bay', 'Igloolik', 'Pangnirtung', 'Pond Inlet', 'Cape Dorset', 'Clyde River', 'Gjoa Haven', 'Kugluktuk', 'Resolute', 'Taloyoak', 'Whale Cove', 'Chesterfield Inlet', 'Coral Harbour', 'Grise Fiord'],
  'Yukon': ['Whitehorse', 'Dawson City', 'Watson Lake', 'Haines Junction', 'Carmacks', 'Faro', 'Mayo', 'Teslin', 'Pelly Crossing', 'Ross River', 'Old Crow', 'Beaver Creek', 'Carcross', 'Tagish', 'Mount Lorne', 'Ibex Valley', 'Marsh Lake', 'Takhini'],

  // United Kingdom
  'England': ['London', 'Birmingham', 'Manchester', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol', 'Leicester', 'Coventry', 'Nottingham', 'Kingston upon Hull', 'Newcastle upon Tyne', 'Stoke-on-Trent', 'Southampton', 'Derby', 'Portsmouth', 'Brighton', 'Reading', 'Northampton', 'Luton'],
  'Scotland': ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Inverness', 'Perth', 'Stirling', 'Ayr', 'Dumfries', 'Falkirk', 'Paisley', 'Kilmarnock', 'Livingston', 'Cumbernauld', 'Hamilton', 'Dunfermline', 'East Kilbride', 'Greenock'],
  'Wales': ['Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Barry', 'Caerphilly', 'Rhondda', 'Port Talbot', 'Bridgend', 'Llanelli', 'Merthyr Tydfil', 'Aberdare', 'Pontypridd', 'Neath', 'Cwmbran', 'Bangor', 'Carmarthen', 'Haverfordwest'],
  'Northern Ireland': ['Belfast', 'Derry', 'Lisburn', 'Newry', 'Bangor', 'Craigavon', 'Castlereagh', 'Carrickfergus', 'Newtownabbey', 'Coleraine', 'Ballymena', 'Larne', 'Omagh', 'Enniskillen', 'Downpatrick', 'Strabane', 'Armagh', 'Limavady'],

  // Australia
  'New South Wales': ['Sydney', 'Newcastle', 'Wollongong', 'Albury', 'Wagga Wagga', 'Tamworth', 'Orange', 'Dubbo', 'Nowra', 'Broken Hill', 'Bathurst', 'Lismore', 'Port Macquarie', 'Coffs Harbour', 'Grafton', 'Armidale', 'Queanbeyan', 'Goulburn'],
  'Victoria': ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Latrobe', 'Albury-Wodonga', 'Shepparton', 'Mildura', 'Warrnambool', 'Sunbury', 'Traralgon', 'Wangaratta', 'Horsham', 'Colac', 'Hamilton', 'Echuca', 'Swan Hill', 'Sale'],
  'Queensland': ['Brisbane', 'Gold Coast', 'Cairns', 'Townsville', 'Toowoomba', 'Rockhampton', 'Mackay', 'Bundaberg', 'Hervey Bay', 'Gladstone', 'Mount Isa', 'Maryborough', 'Gympie', 'Warwick', 'Emerald', 'Charters Towers', 'Innisfail', 'Ayr'],
  'Western Australia': ['Perth', 'Fremantle', 'Bunbury', 'Geraldton', 'Kalgoorlie', 'Albany', 'Broome', 'Port Hedland', 'Karratha', 'Busselton', 'Mandurah', 'Esperance', 'Carnarvon', 'Kununurra', 'Newman', 'Derby', 'Exmouth', 'Katanning'],
  'South Australia': ['Adelaide', 'Mount Gambier', 'Whyalla', 'Murray Bridge', 'Port Augusta', 'Port Pirie', 'Port Lincoln', 'Victor Harbor', 'Gawler', 'Kadina', 'Naracoorte', 'Millicent', 'Berri', 'Roxby Downs', 'Coober Pedy', 'Ceduna', 'Roxby Downs', 'Wallaroo'],
  'Tasmania': ['Hobart', 'Launceston', 'Devonport', 'Burnie', 'Ulverstone', 'George Town', 'Scottsdale', 'Queenstown', 'Currie', 'Smithton', 'Zeehan', 'Strahan', 'Rosebery', 'Tullah', 'Waratah', 'Wynyard', 'Penguin', 'Sheffield'],
  'Australian Capital Territory': ['Canberra', 'Belconnen', 'Gungahlin', 'Tuggeranong', 'Weston Creek', 'Woden Valley', 'North Canberra', 'South Canberra', 'Jerrabomberra', 'Queanbeyan', 'Yass', 'Goulburn', 'Cooma', 'Braidwood', 'Bungendore', 'Murrumbateman', 'Binalong', 'Harden'],
  'Northern Territory': ['Darwin', 'Alice Springs', 'Palmerston', 'Katherine', 'Nhulunbuy', 'Tennant Creek', 'Yulara', 'Casuarina', 'Humpty Doo', 'Batchelor', 'Jabiru', 'Gove', 'Alyangula', 'Borroloola', 'Daly River', 'Elliott', 'Hermannsburg', 'Kalkarindji'],

  // China - Major cities for key provinces
  'Beijing': ['Beijing', 'Tongzhou', 'Shunyi', 'Changping', 'Daxing', 'Fangshan', 'Mentougou', 'Yanqing', 'Huairou', 'Pinggu', 'Miyun'],
  'Shanghai': ['Shanghai', 'Pudong', 'Huangpu', 'Xuhui', 'Changning', 'Jing\'an', 'Putuo', 'Hongkou', 'Yangpu', 'Minhang', 'Baoshan'],
  'Guangdong': ['Guangzhou', 'Shenzhen', 'Dongguan', 'Foshan', 'Zhongshan', 'Huizhou', 'Jiangmen', 'Zhuhai', 'Shantou', 'Shanwei', 'Zhanjiang', 'Maoming', 'Yangjiang', 'Jieyang', 'Chaozhou', 'Yunfu', 'Meizhou', 'Shaoguan'],
  'Jiangsu': ['Nanjing', 'Suzhou', 'Wuxi', 'Changzhou', 'Xuzhou', 'Nantong', 'Lianyungang', 'Huai\'an', 'Yancheng', 'Yangzhou', 'Zhenjiang', 'Taizhou', 'Suqian', 'Kunshan', 'Zhangjiagang', 'Jiangyin', 'Changshu', 'Yixing'],
  'Zhejiang': ['Hangzhou', 'Ningbo', 'Wenzhou', 'Jiaxing', 'Huzhou', 'Shaoxing', 'Jinhua', 'Quzhou', 'Zhoushan', 'Taizhou', 'Lishui', 'Yiwu', 'Ruian', 'Yueqing', 'Cixi', 'Yuyao', 'Haining', 'Tongxiang'],
  'Shandong': ['Jinan', 'Qingdao', 'Yantai', 'Weifang', 'Jining', 'Zibo', 'Linyi', 'Dezhou', 'Liaocheng', 'Weihai', 'Dongying', 'Zaozhuang', 'Tai\'an', 'Rizhao', 'Laiwu', 'Heze', 'Binzhou', 'Liaocheng'],
  'Sichuan': ['Chengdu', 'Mianyang', 'Deyang', 'Yibin', 'Zigong', 'Nanchong', 'Luzhou', 'Leshan', 'Meishan', 'Guang\'an', 'Suining', 'Neijiang', 'Panzhihua', 'Ya\'an', 'Bazhong', 'Ziyang', 'Dazhou', 'Guangyuan'],
  'Henan': ['Zhengzhou', 'Luoyang', 'Xinxiang', 'Nanyang', 'Kaifeng', 'Anyang', 'Pingdingshan', 'Jiaozuo', 'Puyang', 'Xuchang', 'Luohe', 'Sanmenxia', 'Shangqiu', 'Zhoukou', 'Zhumadian', 'Xinyang', 'Jiyuan', 'Hebi'],
  'Hubei': ['Wuhan', 'Xiangyang', 'Yichang', 'Jingzhou', 'Jingmen', 'Shiyan', 'Suizhou', 'Ezhou', 'Xiaogan', 'Huanggang', 'Huangshi', 'Xianning', 'Enshi', 'Tianmen', 'Qianjiang', 'Shennongjia', 'Xiantao', 'Danjiangkou'],
  'Hunan': ['Changsha', 'Zhuzhou', 'Xiangtan', 'Hengyang', 'Yueyang', 'Changde', 'Shaoyang', 'Yiyang', 'Chenzhou', 'Yongzhou', 'Huaihua', 'Loudi', 'Zhangjiajie', 'Jishou', 'Yuanjiang', 'Liling', 'Xiangxiang', 'Lianyuan'],
  'Fujian': ['Fuzhou', 'Xiamen', 'Quanzhou', 'Zhangzhou', 'Putian', 'Sanming', 'Nanping', 'Longyan', 'Ningde', 'Jinjiang', 'Shishi', 'Fuqing', 'Anxi', 'Yongchun', 'Dehua', 'Jinmen', 'Lianjiang', 'Pingtan'],
  'Anhui': ['Hefei', 'Wuhu', 'Bengbu', 'Huainan', 'Ma\'anshan', 'Huaibei', 'Tongling', 'Anqing', 'Huangshan', 'Chuzhou', 'Fuyang', 'Suzhou', 'Lu\'an', 'Bozhou', 'Chizhou', 'Xuancheng', 'Chaohu', 'Tianchang'],
  'Hebei': ['Shijiazhuang', 'Tangshan', 'Qinhuangdao', 'Handan', 'Xingtai', 'Baoding', 'Zhangjiakou', 'Chengde', 'Cangzhou', 'Langfang', 'Hengshui', 'Dingzhou', 'Renqiu', 'Gaobeidian', 'Bazhou', 'Sanhe', 'Zhuozhou', 'Anguo'],
  'Liaoning': ['Shenyang', 'Dalian', 'Anshan', 'Fushun', 'Benxi', 'Dandong', 'Jinzhou', 'Yingkou', 'Fuxin', 'Liaoyang', 'Panjin', 'Tieling', 'Chaoyang', 'Huludao', 'Gaizhou', 'Dengta', 'Kaiyuan', 'Beipiao'],
  'Jilin': ['Changchun', 'Jilin', 'Siping', 'Liaoyuan', 'Tonghua', 'Baishan', 'Songyuan', 'Baicheng', 'Yanji', 'Gongzhuling', 'Shulan', 'Panshi', 'Meihekou', 'Jiutai', 'Yushu', 'Dehui', 'Fuyu', 'Huadian'],
  'Heilongjiang': ['Harbin', 'Qiqihar', 'Jixi', 'Hegang', 'Shuangyashan', 'Daqing', 'Yichun', 'Jiamusi', 'Qitaihe', 'Mudanjiang', 'Heihe', 'Suihua', 'Daxing\'anling', 'Hailin', 'Ning\'an', 'Mishan', 'Tieli', 'Hailun'],
  'Shanxi': ['Taiyuan', 'Datong', 'Yangquan', 'Changzhi', 'Jincheng', 'Shuozhou', 'Jinzhong', 'Yuncheng', 'Xinzhou', 'Linfen', 'Lüliang', 'Gaoping', 'Yuci', 'Jiexiu', 'Houma', 'Xiaoyi', 'Hejin', 'Yongji'],
  'Shaanxi': ['Xi\'an', 'Tongchuan', 'Baoji', 'Xianyang', 'Weinan', 'Yan\'an', 'Hanzhong', 'Yulin', 'Ankang', 'Shangluo', 'Xingping', 'Hancheng', 'Huayin', 'Fengxiang', 'Fufeng', 'Meixian', 'Qishan', 'Liquan'],
  'Inner Mongolia': ['Hohhot', 'Baotou', 'Wuhai', 'Chifeng', 'Tongliao', 'Ordos', 'Hulunbuir', 'Bayannur', 'Ulanqab', 'Xilingol', 'Alxa', 'Manzhouli', 'Erenhot', 'Yakeshi', 'Genhe', 'Zhalantun', 'Arxan', 'Ulanhot'],
  'Xinjiang': ['Ürümqi', 'Karamay', 'Turpan', 'Hami', 'Changji', 'Shihezi', 'Aral', 'Tumxuk', 'Wujiaqu', 'Beitun', 'Tiemenguan', 'Shuanghe', 'Kokdala', 'Kunyu', 'Huyanghe', 'Bole', 'Yining', 'Kashgar'],
  'Tibet': ['Lhasa', 'Shigatse', 'Chamdo', 'Nyingchi', 'Shannan', 'Nagqu', 'Ngari', 'Gyantse', 'Zetang', 'Bayi', 'Barkam', 'Zhongba', 'Lhatse', 'Saga', 'Gyangze', 'Namling', 'Dingri', 'Yadong'],
  'Qinghai': ['Xining', 'Haidong', 'Golmud', 'Delingha', 'Yushu', 'Mangya', 'Lenghu', 'Dulan', 'Tongren', 'Guide', 'Huzhu', 'Minhe', 'Datong', 'Huangzhong', 'Ping\'an', 'Ledu', 'Hualong', 'Xunhua'],
  'Ningxia': ['Yinchuan', 'Shizuishan', 'Wuzhong', 'Guyuan', 'Zhongwei', 'Qingtongxia', 'Lingwu', 'Yongning', 'Helan', 'Pingluo', 'Huinong', 'Tongxin', 'Yanchi', 'Haiyuan', 'Xiji', 'Longde', 'Jingyuan', 'Pengyang'],
  'Gansu': ['Lanzhou', 'Jiayuguan', 'Jinchang', 'Baiyin', 'Tianshui', 'Wuwei', 'Zhangye', 'Pingliang', 'Jiuquan', 'Qingyang', 'Dingxi', 'Longnan', 'Linxia', 'Gannan', 'Yumen', 'Dunhuang', 'Lintao', 'Hezuo'],
  'Yunnan': ['Kunming', 'Qujing', 'Yuxi', 'Baoshan', 'Zhaotong', 'Lijiang', 'Pu\'er', 'Lincang', 'Chuxiong', 'Honghe', 'Wenshan', 'Xishuangbanna', 'Dali', 'Dehong', 'Nujiang', 'Diqing', 'Dêqên', 'Lijiang'],
  'Guizhou': ['Guiyang', 'Liupanshui', 'Zunyi', 'Anshun', 'Bijie', 'Tongren', 'Qianxinan', 'Qiandongnan', 'Qiannan', 'Kaili', 'Duyun', 'Xingyi', 'Renhuai', 'Chishui', 'Qingzhen', 'Fuquan', 'Guiyang', 'Anshun'],
  'Hainan': ['Haikou', 'Sanya', 'Danzhou', 'Wenchang', 'Qionghai', 'Wanning', 'Dongfang', 'Lingao', 'Chengmai', 'Ding\'an', 'Tunchang', 'Qiongzhong', 'Baisha', 'Changjiang', 'Ledong', 'Lingshui', 'Baoting', 'Wuzhishan'],
  'Guangxi': ['Nanning', 'Liuzhou', 'Guilin', 'Wuzhou', 'Beihai', 'Fangchenggang', 'Qinzhou', 'Guigang', 'Yulin', 'Baise', 'Hezhou', 'Hechi', 'Laibin', 'Chongzuo', 'Binyang', 'Hengxian', 'Pingnan', 'Guiping'],
  'Hong Kong': ['Hong Kong', 'Kowloon', 'New Territories', 'Central', 'Wan Chai', 'Causeway Bay', 'Tsim Sha Tsui', 'Mong Kok', 'Yau Ma Tei', 'Sham Shui Po', 'Kwun Tong', 'Tsuen Wan', 'Sha Tin', 'Tai Po', 'Yuen Long', 'Tuen Mun', 'North Point', 'Aberdeen'],
  'Macau': ['Macau', 'Taipa', 'Coloane', 'Cotai', 'Nossa Senhora de Fátima', 'Santo António', 'São Lázaro', 'São Lourenço', 'Sé', 'Nossa Senhora do Carmo'],

  // Japan - Major cities for key prefectures
  'Tokyo': ['Tokyo', 'Shibuya', 'Shinjuku', 'Chiyoda', 'Setagaya', 'Suginami', 'Nerima', 'Ota', 'Itabashi', 'Katsushika', 'Edogawa', 'Adachi', 'Arakawa', 'Taito', 'Sumida', 'Koto', 'Chuo', 'Minato'],
  'Osaka': ['Osaka', 'Sakai', 'Higashiosaka', 'Hirakata', 'Toyonaka', 'Takatsuki', 'Suita', 'Yao', 'Ibaraki', 'Neyagawa', 'Kishiwada', 'Izumi', 'Tondabayashi', 'Kadoma', 'Moriguchi', 'Settsu', 'Mino', 'Shijonawate'],
  'Kanagawa': ['Yokohama', 'Kawasaki', 'Sagamihara', 'Yokosuka', 'Fujisawa', 'Atsugi', 'Hiratsuka', 'Chigasaki', 'Odawara', 'Kamakura', 'Zama', 'Ebina', 'Ayase', 'Yamato', 'Miura', 'Hayama', 'Hakone', 'Odawara'],
  'Aichi': ['Nagoya', 'Toyota', 'Okazaki', 'Ichinomiya', 'Kasugai', 'Anjo', 'Kariya', 'Toyohashi', 'Tsushima', 'Handa', 'Tokoname', 'Tajimi', 'Seto', 'Owariasahi', 'Nishio', 'Kitanagoya', 'Komaki', 'Inazawa'],
  'Hokkaido': ['Sapporo', 'Hakodate', 'Asahikawa', 'Kushiro', 'Obihiro', 'Kitami', 'Muroran', 'Otaru', 'Tomakomai', 'Iwamizawa', 'Abashiri', 'Nemuro', 'Wakkanai', 'Monbetsu', 'Fukagawa', 'Bibai', 'Yubari', 'Takikawa'],
  'Kyoto': ['Kyoto', 'Uji', 'Kameoka', 'Joyo', 'Muko', 'Nagaokakyo', 'Yawata', 'Miyazu', 'Maizuru', 'Ayabe', 'Fukuchiyama', 'Kameoka', 'Nantan', 'Kyotango', 'Inami', 'Kumiyama', 'Ide', 'Oyamazaki'],
  'Hyogo': ['Kobe', 'Himeji', 'Amagasaki', 'Nishinomiya', 'Akashi', 'Kakogawa', 'Takarazuka', 'Itami', 'Tatsuno', 'Aioi', 'Asago', 'Sasayama', 'Toyooka', 'Tamba', 'Yabu', 'Mikata', 'Shin\'onsen', 'Kamikawa'],
  'Fukuoka': ['Fukuoka', 'Kitakyushu', 'Kurume', 'Omuta', 'Iizuka', 'Tagawa', 'Yanagawa', 'Yukuhashi', 'Chikushino', 'Kasuga', 'Onojo', 'Munakata', 'Dazaifu', 'Nakagawa', 'Koga', 'Ukiha', 'Yame', 'Miyawaka'],
  'Saitama': ['Saitama', 'Kawaguchi', 'Koshigaya', 'Soka', 'Kawagoe', 'Tokorozawa', 'Kumagaya', 'Fukaya', 'Honjo', 'Gyoda', 'Ageo', 'Sayama', 'Asaka', 'Wako', 'Niiza', 'Okegawa', 'Kazo', 'Higashimatsuyama'],
  'Chiba': ['Chiba', 'Funabashi', 'Matsudo', 'Ichikawa', 'Kashiwa', 'Ichihara', 'Narashino', 'Sakura', 'Yachiyo', 'Kisarazu', 'Urayasu', 'Abiko', 'Kamagaya', 'Kimitsu', 'Mobara', 'Tateyama', 'Katsuura', 'Isumi'],
  'Shizuoka': ['Shizuoka', 'Hamamatsu', 'Numazu', 'Fuji', 'Ito', 'Mishima', 'Fujinomiya', 'Kakegawa', 'Fukuroi', 'Iwata', 'Yaizu', 'Kosai', 'Omaezaki', 'Kikugawa', 'Makinohara', 'Shimada', 'Fujieda', 'Gotemba'],
  'Hiroshima': ['Hiroshima', 'Fukuyama', 'Kure', 'Onomichi', 'Mihara', 'Takehara', 'Miyoshi', 'Shobara', 'Fuchu', 'Kaita', 'Aki', 'Etajima', 'Hatsukaichi', 'Otake', 'Higashihiroshima', 'Osakikamijima', 'Kaminoseki', 'Saka'],
  'Miyagi': ['Sendai', 'Ishinomaki', 'Shiogama', 'Kesennuma', 'Tagajo', 'Tomiya', 'Natori', 'Iwanuma', 'Kakuda', 'Zao', 'Shiroishi', 'Ogawara', 'Murata', 'Shibata', 'Marumori', 'Watari', 'Yamamoto', 'Matsushima'],
  'Niigata': ['Niigata', 'Nagaoka', 'Joetsu', 'Sanjo', 'Kashiwazaki', 'Shibata', 'Ojiya', 'Kamo', 'Mitsuke', 'Murakami', 'Tsubame', 'Itoigawa', 'Myoko', 'Uonuma', 'Minamiuonuma', 'Tokamachi', 'Agano', 'Gosen'],
  'Nagano': ['Nagano', 'Matsumoto', 'Ueda', 'Iida', 'Okaya', 'Suwa', 'Suzaka', 'Komoro', 'Ina', 'Saku', 'Chino', 'Shiojiri', 'Iiyama', 'Nakano', 'Omachi', 'Azumino', 'Tomi', 'Shimosuwa'],
  'Gifu': ['Gifu', 'Ogaki', 'Kakamigahara', 'Tajimi', 'Seki', 'Nakatsugawa', 'Mino', 'Mizunami', 'Toki', 'Mizuho', 'Hashima', 'Gujo', 'Ena', 'Yoro', 'Ibigawa', 'Gero', 'Shirakawa', 'Takayama'],
  'Mie': ['Yokkaichi', 'Tsu', 'Matsusaka', 'Kuwana', 'Suzuka', 'Ise', 'Nabari', 'Owase', 'Kameyama', 'Iga', 'Toba', 'Shima', 'Kumano', 'Taki', 'Watarai', 'Minamiise', 'Taiki', 'Kihoku'],
  'Shiga': ['Otsu', 'Kusatsu', 'Moriyama', 'Ritto', 'Koka', 'Yasu', 'Konan', 'Omihachiman', 'Hikone', 'Nagahama', 'Maibara', 'Takashima', 'Higashiomi', 'Aisho', 'Echi', 'Gamou', 'Ika', 'Inukami'],
  'Nara': ['Nara', 'Yamatokoriyama', 'Tenri', 'Kashihara', 'Sakurai', 'Gojo', 'Gose', 'Ikoma', 'Katsuragi', 'Uda', 'Yamatotakada', 'Oji', 'Kawanishi', 'Shiki', 'Tawaramoto', 'Kanmaki', 'Koryo', 'Sango'],
  'Wakayama': ['Wakayama', 'Kainan', 'Tanabe', 'Gobo', 'Arida', 'Shingu', 'Kinokawa', 'Hashimoto', 'Iwade', 'Katsuragi', 'Kudoyama', 'Koya', 'Kozagawa', 'Nachikatsuura', 'Shirahama', 'Susami', 'Taiji', 'Yuasa'],
  'Tottori': ['Tottori', 'Yonago', 'Kurayoshi', 'Sakaiminato', 'Hino', 'Nichinan', 'Daisen', 'Hokuei', 'Kotoura', 'Misasa', 'Nanbu', 'Hiezu', 'Hino', 'Kofu', 'Mizuho', 'Nakayama', 'Ochiai', 'Saji'],
  'Shimane': ['Matsue', 'Izumo', 'Masuda', 'Yasugi', 'Gotsu', 'Hamada', 'Oda', 'Unnan', 'Ohnan', 'Yonago', 'Kashima', 'Tsuwano', 'Yoshika', 'Ama', 'Nishinoshima', 'Okinoshima', 'Chibu', 'Mishima'],
  'Okayama': ['Okayama', 'Kurashiki', 'Tsuyama', 'Tamano', 'Kasaoka', 'Ibara', 'Soja', 'Takahashi', 'Niimi', 'Bizen', 'Setouchi', 'Akaiwa', 'Maniwa', 'Katsuta', 'Shobara', 'Mimasaka', 'Aida', 'Wake'],
  'Yamaguchi': ['Yamaguchi', 'Shimonoseki', 'Ube', 'Iwakuni', 'Hofu', 'Kudamatsu', 'Hikari', 'Yanai', 'Hagi', 'Nagato', 'Shunan', 'Mine', 'Abu', 'Ato', 'Hirao', 'Kaminoseki', 'Tabuse', 'Susaki'],
  'Tokushima': ['Tokushima', 'Anan', 'Komatsushima', 'Mima', 'Aizumi', 'Ishii', 'Kamiyama', 'Katsuura', 'Miyoshi', 'Naka', 'Naruto', 'Oe', 'Sanagochi', 'Shishikui', 'Tsurugi', 'Wajiki', 'Yamashiro', 'Yoshinogawa'],
  'Kagawa': ['Takamatsu', 'Marugame', 'Sakaide', 'Zentsuji', 'Kan\'onji', 'Sanuki', 'Higashikagawa', 'Mitoyo', 'Nakatado', 'Ayauta', 'Shozu', 'Tadotsu', 'Tonosho', 'Utazu', 'Yoshida', 'Mannou', 'Naoshima', 'Shodoshima'],
  'Ehime': ['Matsuyama', 'Niihama', 'Imabari', 'Uwajima', 'Yawatahama', 'Saijo', 'Ozu', 'Iyo', 'Seiyo', 'Kamiukena', 'Kumakogen', 'Masaki', 'Tobe', 'Uchiko', 'Yawatahama', 'Ainan', 'Ikata', 'Kihoku'],
  'Kochi': ['Kochi', 'Nankoku', 'Tosa', 'Susaki', 'Sukumo', 'Aki', 'Tano', 'Hata', 'Agawa', 'Aki', 'Kitagawa', 'Mihara', 'Nakatosa', 'Ochi', 'Sakawa', 'Shimanto', 'Takaoka', 'Tosashimizu'],
  'Fukuoka': ['Fukuoka', 'Kitakyushu', 'Kurume', 'Omuta', 'Iizuka', 'Tagawa', 'Yanagawa', 'Yukuhashi', 'Chikushino', 'Kasuga', 'Onojo', 'Munakata', 'Dazaifu', 'Nakagawa', 'Koga', 'Ukiha', 'Yame', 'Miyawaka'],
  'Saga': ['Saga', 'Karatsu', 'Imari', 'Takeo', 'Kashima', 'Ogi', 'Ureshino', 'Taku', 'Arita', 'Genkai', 'Kamimine', 'Kanzaki', 'Kiyama', 'Kouhoku', 'Miyaki', 'Ogi', 'Omachi', 'Shiroishi'],
  'Nagasaki': ['Nagasaki', 'Sasebo', 'Isahaya', 'Omura', 'Hirado', 'Matsuura', 'Tsushima', 'Iki', 'Goto', 'Saikai', 'Unzen', 'Shimabara', 'Minamishimabara', 'Kitaamakusa', 'Amakusa', 'Kamiamakusa', 'Uki', 'Yatsushiro'],
  'Kumamoto': ['Kumamoto', 'Yatsushiro', 'Hitoyoshi', 'Arao', 'Minamata', 'Tamana', 'Kikuchi', 'Aso', 'Takamori', 'Mifune', 'Kashima', 'Uki', 'Yamaga', 'Kosa', 'Mashiki', 'Nishihara', 'Ozu', 'Kumamoto'],
  'Oita': ['Oita', 'Beppu', 'Nakatsu', 'Hita', 'Saiki', 'Usuki', 'Tsukumi', 'Bungotakada', 'Kitsuki', 'Yufu', 'Kunisaki', 'Hiji', 'Kokonoe', 'Kusu', 'Taketa', 'Usa', 'Bungoono', 'Himeshima'],
  'Miyazaki': ['Miyazaki', 'Miyakonojo', 'Nobeoka', 'Nichinan', 'Kobayashi', 'Hyuga', 'Kushima', 'Saito', 'Ebino', 'Gokase', 'Hinokage', 'Kadogawa', 'Kawaminami', 'Kijo', 'Kitagawa', 'Kunitomi', 'Mimata', 'Misato'],
  'Kagoshima': ['Kagoshima', 'Kanoya', 'Makurazaki', 'Akune', 'Izumi', 'Ibusuki', 'Kokubu', 'Kushikino', 'Minamisatsuma', 'Nishinoomote', 'Okuchi', 'Satsumasendai', 'Shibushi', 'Sueyoshi', 'Tarumizu', 'Yusui', 'Amami', 'Kikai'],
  'Okinawa': ['Naha', 'Okinawa', 'Urasoe', 'Ginowan', 'Ishikawa', 'Nago', 'Itoman', 'Tomigusuku', 'Uruma', 'Nakagusuku', 'Kitanakagusuku', 'Nakijin', 'Motobu', 'Onna', 'Ginoza', 'Kin', 'Yomitan', 'Chatan'],

  // Brazil
  'São Paulo': ['São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André', 'Osasco', 'Ribeirão Preto', 'Sorocaba', 'Santos', 'Mauá', 'Carapicuíba', 'Diadema', 'Jundiaí', 'Piracicaba', 'Mogi das Cruzes', 'São José dos Campos', 'Franca', 'Taubaté'],
  'Rio de Janeiro': ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói', 'Campos dos Goytacazes', 'Belford Roxo', 'São João de Meriti', 'Petrópolis', 'Volta Redonda', 'Magé', 'Itaboraí', 'Macaé', 'Cabo Frio', 'Nova Friburgo', 'Barra Mansa', 'Angra dos Reis', 'Teresópolis'],
  'Minas Gerais': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros', 'Ribeirão das Neves', 'Uberaba', 'Governador Valadares', 'Ipatinga', 'Sete Lagoas', 'Divinópolis', 'Santa Luzia', 'Ibirité', 'Poços de Caldas', 'Patos de Minas', 'Teófilo Otoni', 'Varginha'],
  'Bahia': ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro', 'Ilhéus', 'Itabuna', 'Lauro de Freitas', 'Jequié', 'Alagoinhas', 'Barreiras', 'Porto Seguro', 'Simões Filho', 'Paulo Afonso', 'Eunápolis', 'Guanambi', 'Jacobina', 'Senhor do Bonfim'],
  'Rio Grande do Sul': ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria', 'Gravataí', 'Viamão', 'Novo Hamburgo', 'São Leopoldo', 'Rio Grande', 'Alvorada', 'Passo Fundo', 'Uruguaiana', 'Bagé', 'Sapucaia do Sul', 'Santa Cruz do Sul', 'Cachoeirinha', 'Bento Gonçalves'],
  'Paraná': ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'São José dos Pinhais', 'Foz do Iguaçu', 'Colombo', 'Guarapuava', 'Paranaguá', 'Araucária', 'Toledo', 'Apucarana', 'Pinhais', 'Campo Largo', 'Arapongas', 'Umuarama', 'Francisco Beltrão'],
  'Pernambuco': ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina', 'Paulista', 'Cabo de Santo Agostinho', 'Camaragibe', 'Garanhuns', 'Vitória de Santo Antão', 'Igarassu', 'Abreu e Lima', 'São Lourenço da Mata', 'Goiana', 'Carpina', 'Serra Talhada', 'Arcoverde', 'Belo Jardim'],
  'Ceará': ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral', 'Crato', 'Itapipoca', 'Maranguape', 'Iguatu', 'Quixadá', 'Pacatuba', 'Quixeramobim', 'Aracati', 'Canindé', 'Crateús', 'Tianguá', 'Acaraú', 'Icó'],
  'Pará': ['Belém', 'Ananindeua', 'Marituba', 'Castanhal', 'Abaetetuba', 'Cametá', 'Bragança', 'Altamira', 'Santarém', 'Paragominas', 'Tucuruí', 'Barcarena', 'Breves', 'Itaituba', 'Parauapebas', 'Redenção', 'Tailândia', 'Vigia'],
  'Santa Catarina': ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Criciúma', 'Chapecó', 'Itajaí', 'Lages', 'Jaraguá do Sul', 'Palhoça', 'Brusque', 'Balneário Camboriú', 'Tubarão', 'Rio do Sul', 'Araranguá', 'Caçador', 'Concórdia', 'Mafra'],
  'Goiás': ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia', 'Águas Lindas de Goiás', 'Valparaíso de Goiás', 'Trindade', 'Formosa', 'Novo Gama', 'Santo Antônio do Descoberto', 'Senador Canedo', 'Catalão', 'Jataí', 'Itumbiara', 'Caldas Novas', 'Mineiros', 'Morrinhos'],
  'Maranhão': ['São Luís', 'Imperatriz', 'Caxias', 'Timon', 'Codó', 'Paço do Lumiar', 'Açailândia', 'Bacabal', 'Balsas', 'Santa Inês', 'Barra do Corda', 'Pinheiro', 'Coroatá', 'Grajaú', 'Itapecuru Mirim', 'Viana', 'Zé Doca', 'Araioses'],
  'Paraíba': ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux', 'Sousa', 'Cajazeiras', 'Guarabira', 'Mamanguape', 'Monteiro', 'Esperança', 'Cabedelo', 'Areia', 'Bananeiras', 'Alagoa Grande', 'Pombal', 'Catolé do Rocha', 'Itabaiana'],
  'Espírito Santo': ['Vitória', 'Vila Velha', 'Cariacica', 'Serra', 'Cachoeiro de Itapemirim', 'Linhares', 'São Mateus', 'Colatina', 'Guarapari', 'Viana', 'Aracruz', 'Venda Nova do Imigrante', 'Santa Teresa', 'Domingos Martins', 'Alfredo Chaves', 'Anchieta', 'Iconha', 'Itapemirim'],
  'Piauí': ['Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano', 'Campo Maior', 'Barras', 'União', 'Altos', 'Pedro II', 'José de Freitas', 'Oeiras', 'São Raimundo Nonato', 'Corrente', 'Paulistana', 'Simplício Mendes', 'Valença do Piauí', 'Bom Jesus'],
  'Alagoas': ['Maceió', 'Arapiraca', 'Rio Largo', 'Palmeira dos Índios', 'União dos Palmares', 'São Miguel dos Campos', 'Penedo', 'Coruripe', 'Marechal Deodoro', 'Pilar', 'Viçosa', 'Murici', 'Porto Calvo', 'Porto de Pedras', 'Matriz de Camaragibe', 'Jequiá da Praia', 'Barra de Santo Antônio', 'Barra de São Miguel'],
  'Sergipe': ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'São Cristóvão', 'Estância', 'Propriá', 'Simão Dias', 'Tobias Barreto', 'Canindé de São Francisco', 'Nossa Senhora da Glória', 'Poço Redondo', 'Porto da Folha', 'Gararu', 'Monte Alegre de Sergipe', 'Nossa Senhora das Dores', 'Riachão do Dantas', 'Salgado'],
  'Rondônia': ['Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal', 'Rolim de Moura', 'Guajará-Mirim', 'Jaru', 'Ouro Preto do Oeste', 'Buritis', 'Machadinho d\'Oeste', 'Nova Mamoré', 'Alta Floresta d\'Oeste', 'Alto Alegre dos Parecis', 'Alto Paraíso', 'Alvorada d\'Oeste', 'Ariquemes', 'Cabixi'],
  'Acre': ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá', 'Feijó', 'Brasiléia', 'Xapuri', 'Plácido de Castro', 'Mâncio Lima', 'Rodrigues Alves', 'Marechal Thaumaturgo', 'Epitaciolândia', 'Acrelândia', 'Bujari', 'Capixaba', 'Jordão', 'Manoel Urbano', 'Porto Walter'],
  'Amapá': ['Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque', 'Mazagão', 'Vitória do Jari', 'Porto Grande', 'Pedra Branca do Amapari', 'Calçoene', 'Cutias', 'Ferreira Gomes', 'Itaubal', 'Pracuúba', 'Serra do Navio', 'Amapá', 'Tartarugalzinho', 'Ferreira Gomes', 'Pedra Branca do Amapari'],
  'Roraima': ['Boa Vista', 'Rorainópolis', 'Caracaraí', 'Alto Alegre', 'Bonfim', 'Cantá', 'Caroebe', 'Iracema', 'Mucajaí', 'Normandia', 'Pacaraima', 'São João da Baliza', 'São Luiz', 'Uiramutã', 'Amajari', 'Cristalândia do Piauí', 'Manoel Viana', 'Nova Brasilândia d\'Oeste'],
  'Tocantins': ['Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins', 'Colinas do Tocantins', 'Guaraí', 'Formoso do Araguaia', 'Dianópolis', 'Taguatinga', 'Arraias', 'Natividade', 'Conceição do Tocantins', 'Novo Acordo', 'Pium', 'Ponte Alta do Bom Jesus', 'Ponte Alta do Tocantins', 'Porto Alegre do Tocantins'],

  // Argentina
  'Buenos Aires': ['Buenos Aires', 'La Plata', 'Mar del Plata', 'Bahía Blanca', 'Quilmes', 'Lanús', 'General San Martín', 'Merlo', 'Moreno', 'Florencio Varela', 'Tres de Febrero', 'Avellaneda', 'San Miguel', 'Malvinas Argentinas', 'Vicente López', 'San Isidro', 'Tigre', 'San Fernando'],
  'Córdoba': ['Córdoba', 'Villa María', 'Río Cuarto', 'Villa Carlos Paz', 'San Francisco', 'Villa Allende', 'Jesús María', 'Arroyito', 'Bell Ville', 'Marcos Juárez', 'Villa Dolores', 'La Falda', 'Unquillo', 'Morteros', 'Monte Cristo', 'Cruz del Eje', 'Villa Nueva', 'Alta Gracia'],
  'Santa Fe': ['Rosario', 'Santa Fe', 'Rafaela', 'Venado Tuerto', 'Reconquista', 'Santo Tomé', 'Villa Gobernador Gálvez', 'San Lorenzo', 'Pérez', 'Cañada de Gómez', 'Esperanza', 'Sunchales', 'Rufino', 'Firmat', 'Gálvez', 'San Justo', 'Tostado', 'Vera'],
  'Mendoza': ['Mendoza', 'San Rafael', 'Godoy Cruz', 'Luján de Cuyo', 'Maipú', 'Guaymallén', 'Las Heras', 'Rivadavia', 'Tunuyán', 'San Martín', 'General Alvear', 'Malargüe', 'Tupungato', 'Lavalle', 'La Paz', 'Santa Rosa', 'San Carlos', 'Junín'],
  'Tucumán': ['San Miguel de Tucumán', 'Yerba Buena', 'Tafí Viejo', 'Concepción', 'Aguilares', 'Famaillá', 'Monteros', 'Simoca', 'Trancas', 'Burruyacú', 'Cruz Alta', 'Leales', 'Lules', 'Río Chico', 'Chicligasta', 'Graneros', 'Juan Bautista Alberdi', 'La Cocha'],
  'Salta': ['Salta', 'San Salvador de Jujuy', 'Orán', 'Tartagal', 'General Güemes', 'Metán', 'Rosario de la Frontera', 'Cafayate', 'Cachi', 'Molinos', 'La Viña', 'Chicoana', 'Rosario de Lerma', 'Cerrillos', 'La Caldera', 'Vaqueros', 'Campo Quijano', 'El Carril'],
  'Misiones': ['Posadas', 'Oberá', 'Eldorado', 'San Vicente', 'Puerto Iguazú', 'Apóstoles', 'Leandro N. Alem', 'Aristóbulo del Valle', 'Montecarlo', 'Jardín América', 'Candelaria', 'San Pedro', 'Bernardo de Irigoyen', 'El Soberbio', 'San Antonio', 'Garupá', 'Capioví', 'Puerto Rico'],
  'Chaco': ['Resistencia', 'Barranqueras', 'Villa Ángela', 'Presidencia Roque Sáenz Peña', 'Charata', 'General San Martín', 'Quitilipi', 'Machagai', 'Las Breñas', 'Villa Berthet', 'Corzuela', 'Gancedo', 'General Pinedo', 'Tres Isletas', 'La Leonesa', 'La Escondida', 'Colonia Benítez', 'Colonias Unidas'],
  'Formosa': ['Formosa', 'Clorinda', 'Pirané', 'Comandante Fontana', 'Laguna Blanca', 'El Colorado', 'Ibarreta', 'Villa General Güemes', 'Las Lomitas', 'Ingeniero Juárez', 'Palo Santo', 'General Belgrano', 'Pozo del Tigre', 'Villa Dos Trece', 'Buena Vista', 'Colonia Pastoril', 'Estanislao del Campo', 'Fortín Lugones'],
  'Neuquén': ['Neuquén', 'Cutral Có', 'Plottier', 'Zapala', 'San Martín de los Andes', 'Villa La Angostura', 'Junín de los Andes', 'Aluminé', 'Las Lajas', 'Chos Malal', 'Andacollo', 'Loncopué', 'Buta Ranquil', 'El Huecú', 'Mariano Moreno', 'Picún Leufú', 'Piedra del Águila', 'Rincón de los Sauces'],
  'Río Negro': ['Viedma', 'San Carlos de Bariloche', 'General Roca', 'Cipolletti', 'Allen', 'Cinco Saltos', 'Villa Regina', 'Choele Choel', 'Ingeniero Jacobacci', 'El Bolsón', 'San Antonio Oeste', 'Sierra Grande', 'Luis Beltrán', 'Darwin', 'Coronel Belisle', 'Chimpay', 'Chelforó', 'Comallo'],
  'Chubut': ['Rawson', 'Comodoro Rivadavia', 'Trelew', 'Puerto Madryn', 'Esquel', 'Sarmiento', 'Gaiman', 'Dolavon', '28 de Julio', 'Gastre', 'Telsen', 'Gan Gan', 'Las Plumas', 'Paso de Indios', 'Tecka', 'José de San Martín', 'El Maitén', 'Lago Puelo'],
  'Santa Cruz': ['Río Gallegos', 'Caleta Olivia', 'El Calafate', 'Puerto Deseado', 'Pico Truncado', 'Las Heras', 'Perito Moreno', 'Puerto San Julián', 'Comandante Luis Piedra Buena', 'Río Turbio', 'El Chaltén', 'Gobernador Gregores', 'San Julián', 'Puerto Santa Cruz', 'Los Antiguos', 'Tres Lagos', 'El Turbio', 'Yacimiento Río Turbio'],
  'Tierra del Fuego': ['Ushuaia', 'Río Grande', 'Tolhuin', 'Puerto Almanza', 'Puerto Williams', 'Lago Fagnano', 'Estancia Harberton', 'Puerto Harberton', 'Bahía Lapataia', 'Cabo San Pablo', 'Punta Arenas', 'Puerto Natales', 'Porvenir', 'Puerto Williams', 'Puerto Toro', 'Puerto Navarino', 'Caleta María', 'Puerto Yartou'],
  'La Rioja': ['La Rioja', 'Chilecito', 'Arauco', 'Aimogasta', 'Chamical', 'Chepes', 'Famatina', 'Nonogasta', 'Vinchina', 'Villa Unión', 'Sanagasta', 'San Blas de los Sauces', 'Castro Barros', 'Ángel Vicente Peñaloza', 'Arauco', 'Capital', 'Chilecito', 'Coronel Felipe Varela'],
  'Catamarca': ['San Fernando del Valle de Catamarca', 'Valle Viejo', 'Fray Mamerto Esquiú', 'Ambato', 'Ancasti', 'Andalgalá', 'Antofagasta de la Sierra', 'Belén', 'Capayán', 'Capital', 'El Alto', 'La Paz', 'Paclín', 'Pomán', 'Santa María', 'Santa Rosa', 'Tinogasta', 'Valle Viejo'],
  'San Juan': ['San Juan', 'Rawson', 'Rivadavia', 'Santa Lucía', 'Pocito', 'Caucete', 'Jáchal', 'Albardón', 'Angaco', 'Calingasta', 'Calingasta', 'Iglesia', 'Pocito', 'Rawson', 'Rivadavia', 'San Martín', 'Santa Lucía', 'Sarmiento'],
  'San Luis': ['San Luis', 'Villa Mercedes', 'La Punta', 'Merlo', 'Villa de Merlo', 'Concarán', 'Juana Koslay', 'La Toma', 'Naschel', 'Quines', 'San Francisco del Monte de Oro', 'Tilisarao', 'Unión', 'Villa de la Quebrada', 'Villa del Carmen', 'Villa General Roca', 'Villa Larca', 'Villa de Praga'],
  'Santiago del Estero': ['Santiago del Estero', 'La Banda', 'Frías', 'Añatuya', 'Termas de Río Hondo', 'Loreto', 'Quimilí', 'Suncho Corral', 'Villa Ojo de Agua', 'Villa Atamisqui', 'Villa La Punta', 'Villa Salavina', 'Villa Unión', 'Villa Nueva', 'Villa San Martín', 'Villa Silípica', 'Villa Tulumba', 'Villa Yapeyú'],
  'Corrientes': ['Corrientes', 'Goya', 'Mercedes', 'Curuzú Cuatiá', 'Paso de los Libres', 'Monte Caseros', 'Bella Vista', 'Esquina', 'Ituzaingó', 'Santo Tomé', 'Yapeyú', 'San Roque', 'San Luis del Palmar', 'San Cosme', 'Riachuelo', 'Pueblo Libertador', 'Paso de la Patria', 'Mburucuyá'],
  'Entre Ríos': ['Paraná', 'Concordia', 'Gualeguaychú', 'Concepción del Uruguay', 'Villaguay', 'Colón', 'Nogoyá', 'Federación', 'La Paz', 'Victoria', 'Diamante', 'Villa Elisa', 'San José de Feliciano', 'San Salvador', 'Villa Paranacito', 'General Campos', 'General Galarza', 'Hasenkamp'],
  'Jujuy': ['San Salvador de Jujuy', 'Palpalá', 'Perico', 'Libertador General San Martín', 'Humahuaca', 'La Quiaca', 'Tilcara', 'San Pedro de Jujuy', 'El Carmen', 'Purmamarca', 'Maimará', 'Tumbaya', 'Volcán', 'Yala', 'Yavi', 'Caimancito', 'Calilegua', 'Fraile Pintado'],
  'La Pampa': ['Santa Rosa', 'General Pico', 'Realicó', 'Eduardo Castex', 'Macachín', 'Victorica', 'Intendente Alvear', 'Trenel', 'Catriló', 'Quemú Quemú', 'Guatraché', 'General Acha', 'Toay', 'Anguil', 'Bernasconi', 'Colonia Barón', 'Doblas', 'Embajador Martini'],

  // Mexico
  'Mexico City': ['Mexico City', 'Iztapalapa', 'Gustavo A. Madero', 'Álvaro Obregón', 'Coyoacán', 'Benito Juárez', 'Cuauhtémoc', 'Miguel Hidalgo', 'Venustiano Carranza', 'Tlalpan', 'Xochimilco', 'Tláhuac', 'Milpa Alta', 'Magdalena Contreras', 'Cuajimalpa', 'Azcapotzalco', 'Iztacalco', 'Milpa Alta'],
  'Jalisco': ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tonalá', 'Puerto Vallarta', 'Lagos de Moreno', 'Ciudad Guzmán', 'Ocotlán', 'Tepatitlán de Morelos', 'Tequila', 'Chapala', 'San Juan de los Lagos', 'Tala', 'El Salto', 'Tlajomulco de Zúñiga', 'San Pedro Tlaquepaque', 'Tonalá', 'Zapopan'],

  // Germany
  'Bavaria': ['Munich', 'Nuremberg', 'Augsburg', 'Regensburg', 'Würzburg', 'Ingolstadt', 'Fürth', 'Erlangen', 'Bayreuth', 'Bamberg', 'Aschaffenburg', 'Landshut', 'Kempten', 'Rosenheim', 'Neu-Ulm', 'Schweinfurt', 'Passau', 'Straubing'],
  'North Rhine-Westphalia': ['Cologne', 'Düsseldorf', 'Dortmund', 'Essen', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster', 'Mönchengladbach', 'Gelsenkirchen', 'Aachen', 'Krefeld', 'Oberhausen', 'Hagen', 'Hamm', 'Mülheim'],
  'Berlin': ['Berlin'],
  'Hamburg': ['Hamburg'],
  'Baden-Württemberg': ['Stuttgart', 'Mannheim', 'Karlsruhe', 'Freiburg', 'Heidelberg', 'Heilbronn', 'Ulm', 'Pforzheim', 'Reutlingen', 'Esslingen', 'Ludwigsburg', 'Tübingen', 'Villingen-Schwenningen', 'Konstanz', 'Aalen', 'Sindelfingen', 'Schwäbisch Gmünd', 'Offenburg'],

  // France
  'Île-de-France': ['Paris', 'Boulogne-Billancourt', 'Saint-Denis', 'Argenteuil', 'Montreuil', 'Nanterre', 'Créteil', 'Versailles', 'Courbevoie', 'Vitry-sur-Seine', 'Colombes', 'Aulnay-sous-Bois', 'La Courneuve', 'Rueil-Malmaison', 'Champigny-sur-Marne', 'Drancy', 'Massy', 'Noisy-le-Grand'],
  'Provence-Alpes-Côte d\'Azur': ['Marseille', 'Nice', 'Toulon', 'Aix-en-Provence', 'Avignon', 'Cannes', 'Antibes', 'Cannes', 'Grasse', 'Hyères', 'La Seyne-sur-Mer', 'Fréjus', 'Cannes', 'Draguignan', 'Gap', 'Digne-les-Bains', 'Briançon', 'Manosque'],

  // Italy
  'Lombardy': ['Milan', 'Bergamo', 'Brescia', 'Como', 'Cremona', 'Mantua', 'Pavia', 'Varese', 'Lecco', 'Sondrio', 'Lodi', 'Monza', 'Sesto San Giovanni', 'Cinisello Balsamo', 'Legnano', 'Rho', 'Cologno Monzese', 'Paderno Dugnano'],
  'Lazio': ['Rome', 'Latina', 'Frosinone', 'Viterbo', 'Tivoli', 'Anzio', 'Civitavecchia', 'Velletri', 'Formia', 'Gaeta', 'Terracina', 'Cassino', 'Fiumicino', 'Guidonia Montecelio', 'Marino', 'Albano Laziale', 'Frascati', 'Tivoli'],

  // Spain
  'Catalonia': ['Barcelona', 'Badalona', 'Sabadell', 'Terrassa', 'Lleida', 'Tarragona', 'Mataró', 'Santa Coloma de Gramenet', 'Reus', 'Girona', 'Sant Cugat del Vallès', 'Cornellà de Llobregat', 'Sant Boi de Llobregat', 'Rubí', 'Manresa', 'Vilanova i la Geltrú', 'Viladecans', 'Castelldefels'],
  'Madrid': ['Madrid', 'Móstoles', 'Alcalá de Henares', 'Fuenlabrada', 'Leganés', 'Getafe', 'Alcorcón', 'Torrejón de Ardoz', 'Parla', 'Alcobendas', 'Las Rozas de Madrid', 'San Sebastián de los Reyes', 'Pozuelo de Alarcón', 'Rivas-Vaciamadrid', 'Coslada', 'Valdemoro', 'Majadahonda', 'Collado Villalba'],

  // Nigeria
  'Lagos': ['Lagos', 'Ikeja', 'Surulere', 'Alimosho', 'Kosofe', 'Mushin', 'Oshodi-Isolo', 'Somolu', 'Ajeromi-Ifelodun', 'Amuwo-Odofin', 'Ifako-Ijaiye', 'Ojo', 'Badagry', 'Eti Osa', 'Ikorodu', 'Lagos Island', 'Lagos Mainland', 'Shomolu'],
  'Kano': ['Kano', 'Fagge', 'Dala', 'Gwale', 'Kumbotso', 'Nassarawa', 'Tarauni', 'Ungogo', 'Kano Municipal', 'Dambatta', 'Gwarzo', 'Kabo', 'Rimin Gado', 'Tofa', 'Tsanyawa', 'Wudil', 'Garko', 'Gezawa'],

  // South Africa
  'Gauteng': ['Johannesburg', 'Pretoria', 'Soweto', 'Benoni', 'Tembisa', 'Vereeniging', 'Krugersdorp', 'Randburg', 'Centurion', 'Roodepoort', 'Carletonville', 'Midrand', 'Sandton', 'Boksburg', 'Germiston', 'Kempton Park', 'Alberton', 'Brakpan'],
  'Western Cape': ['Cape Town', 'Stellenbosch', 'Paarl', 'Worcester', 'George', 'Oudtshoorn', 'Mossel Bay', 'Knysna', 'Hermanus', 'Saldanha', 'Vredenburg', 'Malmesbury', 'Caledon', 'Swellendam', 'Robertson', 'Ceres', 'Wellington', 'Somerset West'],

  // Egypt
  'Cairo': ['Cairo', 'Giza', 'Shubra El Kheima', 'Helwan', '6th of October City', 'New Cairo', 'Nasr City', 'Maadi', 'Zamalek', 'Dokki', 'Mohandessin', 'Heliopolis', 'New Administrative Capital', 'Badr', 'Obour', 'El Shorouk', 'New Heliopolis', 'Madinaty'],
  'Alexandria': ['Alexandria', 'Borg El Arab', 'New Borg El Arab', 'Abu Qir', 'El Montazah', 'El Raml', 'Sidi Bishr', 'Gleem', 'Stanley', 'Sidi Gaber', 'Smouha', 'Roushdy', 'Louran', 'Miami', 'Mandara', 'Maamoura', 'Agami', 'El Dekheila'],

  // Turkey
  'Istanbul': ['Istanbul', 'Beylikdüzü', 'Büyükçekmece', 'Çatalca', 'Esenyurt', 'Küçükçekmece', 'Silivri', 'Sultangazi', 'Arnavutköy', 'Başakşehir', 'Bağcılar', 'Bahçelievler', 'Bakırköy', 'Bayrampaşa', 'Beşiktaş', 'Beyoğlu', 'Fatih', 'Gaziosmanpaşa'],
  'Ankara': ['Ankara', 'Çankaya', 'Keçiören', 'Yenimahalle', 'Mamak', 'Sincan', 'Altındağ', 'Etimesgut', 'Pursaklar', 'Gölbaşı', 'Polatlı', 'Beypazarı', 'Ayaş', 'Nallıhan', 'Kızılcahamam', 'Çubuk', 'Elmadağ', 'Kalecik'],

  // Thailand
  'Bangkok': ['Bangkok', 'Thonburi', 'Bang Sue', 'Chatuchak', 'Lak Si', 'Bang Khen', 'Don Mueang', 'Lak Si', 'Sai Mai', 'Khan Na Yao', 'Saphan Sung', 'Wang Thonglang', 'Huai Khwang', 'Bangkok Noi', 'Bangkok Yai', 'Phra Nakhon', 'Dusit', 'Nong Chok'],
  'Chiang Mai': ['Chiang Mai', 'Mae Rim', 'Hang Dong', 'San Kamphaeng', 'Samoeng', 'Mae Taeng', 'Doi Saket', 'Mae On', 'Chom Thong', 'Doi Lo', 'Hot', 'Omkoi', 'Saraphi', 'San Pa Tong', 'Mae Wang', 'Doi Tao', 'Fang', 'Chai Prakan'],

  // Philippines
  'Metro Manila': ['Manila', 'Quezon City', 'Caloocan', 'Las Piñas', 'Makati', 'Malabon', 'Mandaluyong', 'Marikina', 'Muntinlupa', 'Navotas', 'Parañaque', 'Pasay', 'Pasig', 'Pateros', 'San Juan', 'Taguig', 'Valenzuela', 'Muntinlupa'],
  'Cebu': ['Cebu City', 'Lapu-Lapu', 'Mandaue', 'Talisay', 'Toledo', 'Danao', 'Compostela', 'Liloan', 'Consolacion', 'Cordova', 'Minglanilla', 'Naga', 'San Fernando', 'San Remigio', 'Sogod', 'Tuburan', 'Aloguinsan', 'Argao'],

  // Vietnam
  'Ho Chi Minh City': ['Ho Chi Minh City', 'District 1', 'District 2', 'District 3', 'District 4', 'District 5', 'District 6', 'District 7', 'District 8', 'District 9', 'District 10', 'District 11', 'District 12', 'Binh Thanh', 'Tan Binh', 'Tan Phu', 'Phu Nhuan', 'Go Vap'],
  'Hanoi': ['Hanoi', 'Ba Dinh', 'Hoan Kiem', 'Dong Da', 'Hai Ba Trung', 'Hoang Mai', 'Thanh Xuan', 'Long Bien', 'Nam Tu Liem', 'Bac Tu Liem', 'Cau Giay', 'Ha Dong', 'Son Tay', 'Me Linh', 'Dong Anh', 'Gia Lam', 'Quoc Oai', 'Thach That'],

  // Iran
  'Tehran': ['Tehran', 'Karaj', 'Eslamshahr', 'Shahriar', 'Qods', 'Malard', 'Pakdasht', 'Varamin', 'Rey', 'Damavand', 'Firuzkuh', 'Pardis', 'Hashtgerd', 'Nazarabad', 'Savojbolagh', 'Fardis', 'Mahdasht', 'Garmdarreh'],
  'Isfahan': ['Isfahan', 'Kashan', 'Najafabad', 'Shahin Shahr', 'Mobarakeh', 'Falavarjan', 'Natanz', 'Shahreza', 'Golpayegan', 'Nain', 'Aran va Bidgol', 'Ardestan', 'Khomeyni Shahr', 'Lenjan', 'Tiran va Karvan', 'Dehaqan', 'Fereydunshahr', 'Chadegan'],

  // Saudi Arabia
  'Al Riyadh': ['Riyadh', 'Diriyah', 'Al Kharj', 'Dawadmi', 'Al Majma\'ah', 'Al Zulfi', 'Al Ghat', 'Shagra', 'Afif', 'Rumah', 'Thadiq', 'Marat', 'Al Duwadimi', 'Al Quway\'iyah', 'Al Hariq', 'Al Aflaj', 'Wadi ad-Dawasir', 'As Sulayyil'],
  'Makkah': ['Mecca', 'Jeddah', 'Taif', 'Rabigh', 'Al Qunfudhah', 'Al Lith', 'Al Jumum', 'Khulays', 'Al Kamil', 'Ranyah', 'Turubah', 'Al Khurmah', 'Adham', 'Al Muwassam', 'Al Bahah', 'Baljurashi', 'Qilwah', 'Mandaq'],

  // Indonesia
  'Jakarta': ['Jakarta', 'Central Jakarta', 'North Jakarta', 'South Jakarta', 'East Jakarta', 'West Jakarta', 'Thousand Islands'],
  'West Java': ['Bandung', 'Bekasi', 'Depok', 'Bogor', 'Tangerang', 'Cimahi', 'Sukabumi', 'Cirebon', 'Tasikmalaya', 'Banjar', 'Garut', 'Sumedang', 'Indramayu', 'Subang', 'Purwakarta', 'Karawang', 'Cianjur', 'Kuningan'],
  'East Java': ['Surabaya', 'Malang', 'Kediri', 'Blitar', 'Mojokerto', 'Pasuruan', 'Probolinggo', 'Lumajang', 'Jember', 'Banyuwangi', 'Bondowoso', 'Situbondo', 'Tulungagung', 'Tulungagung', 'Trenggalek', 'Ponorogo', 'Pacitan', 'Magetan'],

  // Bangladesh
  'Dhaka': ['Dhaka', 'Gazipur', 'Narayanganj', 'Savar', 'Dhamrai', 'Keraniganj', 'Dohar', 'Nawabganj', 'Manikganj', 'Munshiganj', 'Tangail', 'Kishoreganj', 'Narsingdi', 'Shariatpur', 'Faridpur', 'Rajbari', 'Madaripur', 'Gopalganj'],
  'Chittagong': ['Chittagong', 'Cox\'s Bazar', 'Comilla', 'Feni', 'Lakshmipur', 'Noakhali', 'Chandpur', 'Brahmanbaria', 'Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj', 'Rangamati', 'Bandarban', 'Khagrachhari', 'Rangamati', 'Cox\'s Bazar', 'Teknaf'],

  // Russia - Major cities for key regions
  'Moscow': ['Moscow', 'Zelenograd', 'Troitsk', 'Shcherbinka', 'Krasnogorsk', 'Mytishchi', 'Khimki', 'Balashikha', 'Lyubertsy', 'Podolsk', 'Odintsovo', 'Krasnogorsk', 'Dmitrov', 'Sergiev Posad', 'Pushkino', 'Zvenigorod', 'Ruza', 'Volokolamsk'],
  'St. Petersburg': ['Saint Petersburg', 'Kolpino', 'Kronstadt', 'Pushkin', 'Pavlovsk', 'Gatchina', 'Vyborg', 'Sosnovy Bor', 'Lomonosov', 'Peterhof', 'Sestroretsk', 'Zelenogorsk', 'Sestroretsk', 'Krasnoye Selo', 'Lomonosov', 'Petrodvorets', 'Pushkin', 'Pavlovsk'],

  // Colombia
  'Bogotá': ['Bogotá', 'Soacha', 'Chía', 'Cajicá', 'Zipaquirá', 'Facatativá', 'Girardot', 'Fusagasugá', 'Sibaté', 'Mosquera', 'Madrid', 'Funza', 'Cota', 'Sopó', 'Tabio', 'Tenjo', 'Gachancipá', 'Suesca'],
  'Antioquia': ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Sabaneta', 'La Estrella', 'Caldas', 'Copacabana', 'Girardota', 'Barbosa', 'Rionegro', 'Marinilla', 'El Retiro', 'Guarne', 'Santuario', 'Granada', 'Concepción', 'Alejandría'],

  // Chile
  'Metropolitana': ['Santiago', 'Puente Alto', 'Maipú', 'La Florida', 'San Bernardo', 'Peñalolén', 'Macul', 'Quilicura', 'Las Condes', 'Ñuñoa', 'San Miguel', 'La Cisterna', 'El Bosque', 'La Granja', 'La Pintana', 'Recoleta', 'Independencia', 'Conchalí'],
  'Valparaíso': ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'San Antonio', 'Los Andes', 'Quillota', 'La Calera', 'Limache', 'Olmué', 'Casablanca', 'Cartagena', 'El Quisco', 'Algarrobo', 'Santo Domingo', 'Zapallar', 'Papudo', 'Puchuncaví'],

  // Peru
  'Lima': ['Lima', 'Callao', 'San Juan de Lurigancho', 'San Martín de Porres', 'Comas', 'Villa El Salvador', 'Villa María del Triunfo', 'San Juan de Miraflores', 'Chorrillos', 'Barranco', 'Miraflores', 'San Isidro', 'La Molina', 'Santiago de Surco', 'Chaclacayo', 'Ate', 'Santa Anita', 'El Agustino'],
  'Cusco': ['Cusco', 'Sicuani', 'Urubamba', 'Calca', 'Pisac', 'Ollantaytambo', 'Chinchero', 'Maras', 'Moray', 'Yucay', 'Huaran', 'Taray', 'Coya', 'Lamay', 'Paucartambo', 'Quispicanchi', 'Acomayo', 'Anta']
};

const seedAllCities = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://inquiriesesa_db_user:9OOQm5boLEOdNZsi@cluster0.ktqsjbu.mongodb.net/?appName=Cluster0');
    console.log('MongoDB Connected...');

    let totalCreated = 0;
    let totalErrors = 0;
    const provinces = await Province.find({});

    for (const province of provinces) {
      const country = await Country.findById(province.country);
      const countryName = country ? country.name : 'Unknown';
      
      // Try to find cities using 'Country|Province' format first, then fallback to just province name
      const cities = citiesByProvince[`${countryName}|${province.name}`] || citiesByProvince[province.name];
      
      if (cities && cities.length > 0) {
        console.log(`\n🏙️  Processing ${province.name}, ${countryName}...`);
        
        for (const cityName of cities) {
          try {
            // Check if city already exists
            const existing = await City.findOne({
              name: cityName,
              province: province._id
            });
            
            if (!existing) {
              await City.create({
                name: cityName,
                province: province._id,
                isActive: true
              });
              totalCreated++;
            }
          } catch (error) {
            if (error.code !== 11000) { // Ignore duplicate errors
              console.error(`Error creating ${cityName} in ${province.name}:`, error.message);
              totalErrors++;
            }
          }
        }
        console.log(`✅ Added ${cities.length} cities for ${province.name}`);
      } else {
        // If no cities defined, add at least the province capital/main city
        const existingCities = await City.countDocuments({ province: province._id });
        if (existingCities === 0) {
          console.log(`\n⚠️  No cities defined for ${province.name}, ${countryName} - adding default city...`);
          try {
            const defaultCityName = `${province.name} City`;
            const existing = await City.findOne({
              name: defaultCityName,
              province: province._id
            });
            
            if (!existing) {
              await City.create({
                name: defaultCityName,
                province: province._id,
                isActive: true
              });
              totalCreated++;
              console.log(`✅ Added default city "${defaultCityName}" for ${province.name}`);
            }
          } catch (error) {
            if (error.code !== 11000) {
              console.error(`Error creating default city for ${province.name}:`, error.message);
              totalErrors++;
            }
          }
        }
      }
    }

    console.log(`\n✅ Successfully seeded ${totalCreated} cities`);
    console.log(`   Errors: ${totalErrors}`);
    
    const totalCities = await City.countDocuments({});
    console.log(`   Total cities in database: ${totalCities}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding cities:', error);
    process.exit(1);
  }
};

seedAllCities();


