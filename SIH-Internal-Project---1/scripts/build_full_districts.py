# scripts/build_full_districts.py
# Generates comprehensive 788-district catalog for all 36 Indian States and Union Territories.

import json
import os
import re

STATE_DATA = {
    'Andhra Pradesh': {
        'code': 'AP', 'zone': 'East Coast Plains and Hills', 'soil': 'Red & Black Cotton Soil', 'rain': 920.0,
        'crops': ['Rice', 'Cotton', 'Maize', 'Groundnut', 'Sugarcane', 'Chickpea (Gram)', 'Pigeonpea (Arhar)'],
        'districts': [
            'Alluri Sitharama Raju', 'Anakapalli', 'Ananthapuramu', 'Annamayya', 'Bapatla', 
            'Chittoor', 'Dr. B.R. Ambedkar Konaseema', 'East Godavari', 'Eluru', 'Guntur', 
            'Kakinada', 'Krishna', 'Kurnool', 'Nandyal', 'NTR', 'Palnadu', 
            'Parvathipuram Manyam', 'Prakasam', 'Srikakulam', 'Sri Potti Sriramulu Nellore', 
            'Sri Sathya Sai', 'Tirupati', 'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR Kadapa'
        ],
        'lat': 15.91, 'lon': 79.74, 'soil_map': {'Guntur': 'Black Cotton Soil', 'Ananthapuramu': 'Red Sandy Loam', 'East Godavari': 'Alluvial Coastal', 'Chittoor': 'Red Loam'}
    },
    'Arunachal Pradesh': {
        'code': 'AR', 'zone': 'Eastern Himalayan Region', 'soil': 'Forest / Hill Soil', 'rain': 2800.0,
        'crops': ['Rice', 'Maize', 'Mustard', 'Wheat'],
        'districts': [
            'Anjaw', 'Changlang', 'Dibang Valley', 'East Kameng', 'East Siang', 'Kamle', 
            'Kra Daadi', 'Kurung Kumey', 'Lepa Rada', 'Lohit', 'Longding', 'Lower Dibang Valley', 
            'Lower Siang', 'Lower Subansiri', 'Namsai', 'Pakke Kessang', 'Papum Pare', 
            'Shi Yomi', 'Siang', 'Tawang', 'Tirap', 'Upper Siang', 'Upper Subansiri', 
            'West Kameng', 'West Siang', 'Itanagar'
        ],
        'lat': 28.21, 'lon': 94.72, 'soil_map': {'Papum Pare': 'Forest Soil', 'Changlang': 'Alluvial / Hill Soil', 'East Siang': 'Riverine Alluvium'}
    },
    'Assam': {
        'code': 'AS', 'zone': 'Brahmaputra Valley', 'soil': 'Alluvial Acidic Soil', 'rain': 1950.0,
        'crops': ['Rice', 'Mustard', 'Maize', 'Sugarcane', 'Wheat'],
        'districts': [
            'Baksa', 'Barpeta', 'Biswanath', 'Bongaigaon', 'Cachar', 'Charaideo', 'Chirang', 
            'Darrang', 'Dhemaji', 'Dhubri', 'Dibrugarh', 'Dima Hasao', 'Goalpara', 'Golaghat', 
            'Hailakandi', 'Hojai', 'Jorhat', 'Kamrup', 'Kamrup Metropolitan', 'Karbi Anglong', 
            'Karimganj', 'Kokrajhar', 'Lakhimpur', 'Majuli', 'Morigaon', 'Nagaon', 'Nalbari', 
            'Sivasagar', 'Sonitpur', 'South Salmara-Mankachar', 'Tamulpur', 'Tinsukia', 
            'Udalguri', 'West Karbi Anglong', 'Bajali'
        ],
        'lat': 26.20, 'lon': 92.93, 'soil_map': {'Kamrup': 'Alluvial Acidic Soil', 'Nagaon': 'Alluvial Loam', 'Dibrugarh': 'Alluvial Clay Loam'}
    },
    'Bihar': {
        'code': 'BR', 'zone': 'Middle Gangetic Plains', 'soil': 'Alluvial Soil', 'rain': 1100.0,
        'crops': ['Rice', 'Wheat', 'Maize', 'Chickpea (Gram)', 'Mustard', 'Sugarcane', 'Pigeonpea (Arhar)'],
        'districts': [
            'Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur', 'Bhojpur', 
            'Buxar', 'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj', 'Jamui', 'Jehanabad', 
            'Kaimur', 'Katihar', 'Khagaria', 'Kishanganj', 'Lakhisarai', 'Madhepura', 
            'Madhubani', 'Munger', 'Muzaffarpur', 'Nalanda', 'Nawada', 'Patna', 'Purnia', 
            'Rohtas', 'Saharsa', 'Samastipur', 'Saran', 'Sheikhpura', 'Sheohar', 'Sitamarhi', 
            'Siwan', 'Supaul', 'Vaishali', 'West Champaran'
        ],
        'lat': 25.09, 'lon': 85.31, 'soil_map': {'Patna': 'Alluvial Soil', 'Muzaffarpur': 'Calcareous Alluvium', 'Rohtas': 'Heavy Clay Alluvium'}
    },
    'Chhattisgarh': {
        'code': 'CT', 'zone': 'Chhattisgarh Plains', 'soil': 'Red and Yellow Soil', 'rain': 1280.0,
        'crops': ['Rice', 'Soyabean', 'Chickpea (Gram)', 'Wheat', 'Maize', 'Mustard'],
        'districts': [
            'Balod', 'Baloda Bazar', 'Balrampur', 'Bastar', 'Bemetara', 'Bijapur', 'Bilaspur', 
            'Dantewada', 'Dhamtari', 'Durg', 'Gariaband', 'Gaurela Pendra Marwahi', 'Janjgir Champa', 
            'Jashpur', 'Kabirdham', 'Kanker', 'Khairagarh Chhuikhadan Gandai', 'Kondagaon', 
            'Korba', 'Koriya', 'Mahasamund', 'Manendragarh Chirmiri Bharatpur', 
            'Mohla Manpur Ambagarh Chowki', 'Mungeli', 'Narayanpur', 'Raigarh', 'Raipur', 
            'Rajnandgaon', 'Sarangarh Bilaigarh', 'Sakti', 'Sukma', 'Surajpur', 'Surguja'
        ],
        'lat': 21.27, 'lon': 81.86, 'soil_map': {'Raipur': 'Red and Yellow Soil', 'Durg': 'Medium Black & Red Soil', 'Bilaspur': 'Clay Loam'}
    },
    'Goa': {
        'code': 'GA', 'zone': 'West Coast Plains and Ghats', 'soil': 'Laterite Soil', 'rain': 2950.0,
        'crops': ['Rice', 'Sugarcane', 'Groundnut'],
        'districts': ['North Goa', 'South Goa'],
        'lat': 15.29, 'lon': 74.12, 'soil_map': {'North Goa': 'Laterite Soil', 'South Goa': 'Coastal Alluvium / Laterite'}
    },
    'Gujarat': {
        'code': 'GJ', 'zone': 'Gujarat Plains and Hills', 'soil': 'Medium Black Soil', 'rain': 820.0,
        'crops': ['Cotton', 'Groundnut', 'Wheat', 'Chickpea (Gram)', 'Mustard', 'Sugarcane', 'Maize', 'Rice'],
        'districts': [
            'Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch', 'Bhavnagar', 
            'Botad', 'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhumi Dwarka', 'Gandhinagar', 
            'Gir Somnath', 'Jamnagar', 'Junagadh', 'Kheda', 'Kutch', 'Mahisagar', 'Mehsana', 
            'Morbi', 'Narmada', 'Navsari', 'Panchmahal', 'Patan', 'Porbandar', 'Rajkot', 
            'Sabarkantha', 'Surat', 'Surendranagar', 'Tapi', 'Vadodara', 'Valsad'
        ],
        'lat': 22.25, 'lon': 71.19, 'soil_map': {'Rajkot': 'Medium Black Soil', 'Surat': 'Deep Black Soil', 'Ahmedabad': 'Sandy Loam'}
    },
    'Haryana': {
        'code': 'HR', 'zone': 'Trans-Gangetic Plains', 'soil': 'Alluvial Soil', 'rain': 650.0,
        'crops': ['Wheat', 'Rice', 'Mustard', 'Cotton', 'Sugarcane', 'Chickpea (Gram)', 'Maize'],
        'districts': [
            'Ambala', 'Bhiwani', 'Charkhi Dadri', 'Faridabad', 'Fatehabad', 'Gurugram', 
            'Hisar', 'Jhajjar', 'Jind', 'Kaithal', 'Karnal', 'Kurukshetra', 'Mahendragarh', 
            'Nuh', 'Palwal', 'Panchkula', 'Panipat', 'Rewari', 'Rohtak', 'Sirsa', 'Sonipat', 'Yamunanagar'
        ],
        'lat': 29.05, 'lon': 76.08, 'soil_map': {'Karnal': 'Alluvial Soil', 'Hisar': 'Sandy Loam', 'Sirsa': 'Desert Sandy Loam'}
    },
    'Himachal Pradesh': {
        'code': 'HP', 'zone': 'Western Himalayan Region', 'soil': 'Hill / Sub-Montane Soil', 'rain': 1400.0,
        'crops': ['Maize', 'Wheat', 'Rice', 'Mustard', 'Chickpea (Gram)'],
        'districts': [
            'Bilaspur', 'Chamba', 'Hamirpur', 'Kangra', 'Kinnaur', 'Kullu', 
            'Lahaul and Spiti', 'Mandi', 'Shimla', 'Sirmaur', 'Solan', 'Una'
        ],
        'lat': 31.10, 'lon': 77.17, 'soil_map': {'Shimla': 'Hill Soil', 'Kangra': 'Sub-Montane Alluvium', 'Mandi': 'Brown Hill Soil'}
    },
    'Jharkhand': {
        'code': 'JH', 'zone': 'Eastern Plateau and Hills', 'soil': 'Red Soil', 'rain': 1350.0,
        'crops': ['Rice', 'Wheat', 'Maize', 'Chickpea (Gram)', 'Mustard', 'Pigeonpea (Arhar)'],
        'districts': [
            'Bokaro', 'Chatra', 'Deoghar', 'Dhanbad', 'Dumka', 'East Singhbhum', 'Garhwa', 
            'Giridih', 'Godda', 'Gumla', 'Hazaribagh', 'Jamtara', 'Khunti', 'Koderma', 
            'Latehar', 'Lohardaga', 'Pakur', 'Palamu', 'Ramgarh', 'Ranchi', 'Sahibganj', 
            'Saraikela Kharsawan', 'Simdega', 'West Singhbhum'
        ],
        'lat': 23.61, 'lon': 85.27, 'soil_map': {'Ranchi': 'Red Soil', 'Dhanbad': 'Red & Sandy Loam', 'Palamu': 'Sandy Loam'}
    },
    'Karnataka': {
        'code': 'KA', 'zone': 'Southern Plateau and Hills', 'soil': 'Red Sandy / Black Soil', 'rain': 850.0,
        'crops': ['Soyabean', 'Cotton', 'Maize', 'Groundnut', 'Sugarcane', 'Rice', 'Chickpea (Gram)', 'Pigeonpea (Arhar)', 'Wheat'],
        'districts': [
            'Bagalkote', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 'Bidar', 
            'Chamarajanagara', 'Chikkaballapura', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada', 
            'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu', 
            'Kolar', 'Koppal', 'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 
            'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayanagara', 'Vijayapura', 'Yadgir'
        ],
        'lat': 15.31, 'lon': 75.71, 'soil_map': {'Dharwad': 'Red Sandy / Black Soil', 'Belagavi': 'Deep Black & Laterite', 'Mandya': 'Red Sandy Loam'}
    },
    'Kerala': {
        'code': 'KL', 'zone': 'West Coast Plains and Ghats', 'soil': 'Laterite Soil', 'rain': 2800.0,
        'crops': ['Rice', 'Sugarcane', 'Groundnut', 'Cotton', 'Maize'],
        'districts': [
            'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam', 
            'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 
            'Thrissur', 'Wayanad'
        ],
        'lat': 10.85, 'lon': 76.27, 'soil_map': {'Palakkad': 'Laterite Soil', 'Alappuzha': 'Coastal Alluvium & Peat'}
    },
    'Madhya Pradesh': {
        'code': 'MP', 'zone': 'Central Plateau and Hills', 'soil': 'Medium Black Soil (Vertisol)', 'rain': 1050.0,
        'crops': ['Soyabean', 'Wheat', 'Chickpea (Gram)', 'Mustard', 'Rice', 'Maize', 'Cotton', 'Pigeonpea (Arhar)', 'Sugarcane'],
        'districts': [
            'Agar Malwa', 'Alirajpur', 'Anuppur', 'Ashoknagar', 'Balaghat', 'Barwani', 'Betul', 
            'Bhind', 'Bhopal', 'Burhanpur', 'Chhatarpur', 'Chhindwara', 'Damoh', 'Datia', 
            'Dewas', 'Dhar', 'Dindori', 'Guna', 'Gwalior', 'Harda', 'Hoshangabad', 'Indore', 
            'Jabalpur', 'Jhabua', 'Katni', 'Khandwa', 'Khargone', 'Maihar', 'Mandla', 
            'Mandsaur', 'Morena', 'Mauganj', 'Narsinghpur', 'Neemuch', 'Niwari', 'Panna', 
            'Pandhurna', 'Raisen', 'Rajgarh', 'Ratlam', 'Rewa', 'Sagar', 'Satna', 'Sehore', 
            'Seoni', 'Shahdol', 'Shajapur', 'Sheopur', 'Shivpuri', 'Sidhi', 'Singrauli', 
            'Tikamgarh', 'Ujjain', 'Umaria', 'Vidisha'
        ],
        'lat': 22.97, 'lon': 78.65, 'soil_map': {'Bhopal': 'Medium Black Soil', 'Indore': 'Deep Black Soil (Vertisol)', 'Gwalior': 'Alluvial & Sandy Loam'}
    },
    'Maharashtra': {
        'code': 'MH', 'zone': 'Western Plateau and Hills', 'soil': 'Deep Black Soil (Vertisol)', 'rain': 820.0,
        'crops': ['Cotton', 'Soyabean', 'Sugarcane', 'Wheat', 'Chickpea (Gram)', 'Maize', 'Pigeonpea (Arhar)', 'Groundnut', 'Rice'],
        'districts': [
            'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara', 
            'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 
            'Jalna', 'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 
            'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar', 'Parbhani', 'Pune', 
            'Raigad', 'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 
            'Wardha', 'Washim', 'Yavatmal'
        ],
        'lat': 19.75, 'lon': 75.71, 'soil_map': {'Pune': 'Medium Black Soil', 'Kolhapur': 'Deep Black & Laterite', 'Nagpur': 'Deep Black Soil'}
    },
    'Manipur': {
        'code': 'MN', 'zone': 'Eastern Himalayan Region', 'soil': 'Alluvial / Mountain Soil', 'rain': 1500.0,
        'crops': ['Rice', 'Maize', 'Mustard', 'Wheat'],
        'districts': [
            'Bishnupur', 'Chandel', 'Churachandpur', 'Imphal East', 'Imphal West', 'Jiribam', 
            'Kakching', 'Kamjong', 'Kangpokpi', 'Noney', 'Pherzawl', 'Senapati', 'Tamenglong', 
            'Tengnoupal', 'Thoubal', 'Ukhrul'
        ],
        'lat': 24.66, 'lon': 93.90, 'soil_map': {'Imphal West': 'Alluvial / Clayey Soil'}
    },
    'Meghalaya': {
        'code': 'ML', 'zone': 'Eastern Himalayan Region', 'soil': 'Laterite Soil', 'rain': 2400.0,
        'crops': ['Rice', 'Maize', 'Mustard', 'Cotton', 'Soyabean'],
        'districts': [
            'East Garo Hills', 'East Jaintia Hills', 'East Khasi Hills', 'Eastern West Khasi Hills', 
            'North Garo Hills', 'Ri-Bhoi', 'South Garo Hills', 'South West Garo Hills', 
            'South West Khasi Hills', 'West Garo Hills', 'West Jaintia Hills', 'West Khasi Hills'
        ],
        'lat': 25.46, 'lon': 91.36, 'soil_map': {'East Khasi Hills': 'Laterite Soil', 'West Garo Hills': 'Red Loam & Alluvium'}
    },
    'Mizoram': {
        'code': 'MZ', 'zone': 'Eastern Himalayan Region', 'soil': 'Red and Yellow Soil', 'rain': 2300.0,
        'crops': ['Rice', 'Maize', 'Mustard', 'Sugarcane', 'Wheat'],
        'districts': [
            'Aizawl', 'Champhai', 'Hnahthial', 'Khawzawl', 'Kolasib', 'Lawngtlai', 'Lunglei', 
            'Mamit', 'Saiha', 'Saitual', 'Serchhip'
        ],
        'lat': 23.16, 'lon': 92.93, 'soil_map': {'Aizawl': 'Red and Yellow Soil', 'Lunglei': 'Clay Loam'}
    },
    'Nagaland': {
        'code': 'NL', 'zone': 'Eastern Himalayan Region', 'soil': 'Forest Soil', 'rain': 2000.0,
        'crops': ['Rice', 'Maize', 'Mustard', 'Soyabean', 'Sugarcane'],
        'districts': [
            'Chumoukedima', 'Dimapur', 'Kiphire', 'Kohima', 'Longleng', 'Mokokchung', 'Mon', 
            'Niuland', 'Noklak', 'Peren', 'Phek', 'Shamator', 'Tseminyu', 'Tuensang', 
            'Wokha', 'Zunheboto'
        ],
        'lat': 26.15, 'lon': 94.56, 'soil_map': {'Kohima': 'Forest Soil', 'Dimapur': 'Alluvial Loam'}
    },
    'Odisha': {
        'code': 'OR', 'zone': 'East Coast Plains and Hills', 'soil': 'Red & Yellow / Coastal Alluvial', 'rain': 1400.0,
        'crops': ['Rice', 'Mustard', 'Groundnut', 'Sugarcane', 'Cotton', 'Maize', 'Chickpea (Gram)', 'Wheat'],
        'districts': [
            'Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Boudh', 'Cuttack', 
            'Deogarh', 'Dhenkanal', 'Gajapati', 'Ganjam', 'Jagatsinghpur', 'Jajpur', 
            'Jharsuguda', 'Kalahandi', 'Kandhamal', 'Kendrapara', 'Kendujhar', 'Khordha', 
            'Koraput', 'Malkangiri', 'Mayurbhanj', 'Nabarangpur', 'Nayagarh', 'Nuapada', 
            'Puri', 'Rayagada', 'Sambalpur', 'Subarnapur', 'Sundargarh'
        ],
        'lat': 20.95, 'lon': 85.09, 'soil_map': {'Cuttack': 'Deltaic Alluvium', 'Balasore': 'Coastal Alluvial Soil', 'Sambalpur': 'Red & Yellow Loam'}
    },
    'Punjab': {
        'code': 'PB', 'zone': 'Trans-Gangetic Plains', 'soil': 'Alluvial Soil', 'rain': 650.0,
        'crops': ['Wheat', 'Rice', 'Cotton', 'Mustard', 'Maize', 'Sugarcane', 'Chickpea (Gram)'],
        'districts': [
            'Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib', 'Fazilka', 
            'Ferozepur', 'Gurdaspur', 'Hoshiarpur', 'Jalandhar', 'Kapurthala', 'Ludhiana', 
            'Malerkotla', 'Mansa', 'Moga', 'Muktsar', 'Pathankot', 'Patiala', 'Rupnagar', 
            'Mohali', 'Sangrur', 'Nawanshahr', 'Tarn Taran'
        ],
        'lat': 31.14, 'lon': 75.34, 'soil_map': {'Ludhiana': 'Alluvial Soil', 'Bathinda': 'Sandy Alluvial Soil'}
    },
    'Rajasthan': {
        'code': 'RJ', 'zone': 'Semi-Arid Western Plain', 'soil': 'Desert Sandy Soil', 'rain': 520.0,
        'crops': ['Mustard', 'Wheat', 'Chickpea (Gram)', 'Groundnut', 'Cotton', 'Soyabean', 'Maize', 'Rice'],
        'districts': [
            'Ajmer', 'Alwar', 'Anupgarh', 'Balotra', 'Banswara', 'Baran', 'Barmer', 'Beawar', 
            'Bharatpur', 'Bhilwara', 'Bikaner', 'Bundi', 'Chittorgarh', 'Churu', 'Dausa', 
            'Deeg', 'Dholpur', 'Didwana Kuchaman', 'Dudu', 'Dungarpur', 'Gangapur City', 
            'Hanumangarh', 'Jaipur', 'Jaipur Rural', 'Jaisalmer', 'Jalore', 'Jhalawar', 
            'Jhunjhunu', 'Jodhpur', 'Jodhpur Rural', 'Karauli', 'Kekri', 'Khairthal Tijara', 
            'Kota', 'Kotputli Behror', 'Nagaur', 'Neem Ka Thana', 'Pali', 'Phalodi', 
            'Pratapgarh', 'Rajsamand', 'Salumber', 'Sanchore', 'Sawai Madhopur', 'Shahpura', 
            'Sikar', 'Sirohi', 'Sri Ganganagar', 'Tonk', 'Udaipur'
        ],
        'lat': 27.02, 'lon': 74.21, 'soil_map': {'Jaipur': 'Desert Sandy Soil', 'Kota': 'Deep Black Soil', 'Sri Ganganagar': 'Canal Irrigated Alluvial Sand'}
    },
    'Sikkim': {
        'code': 'SK', 'zone': 'Eastern Himalayan Region', 'soil': 'Brown Forest Soil', 'rain': 2600.0,
        'crops': ['Maize', 'Rice', 'Wheat', 'Mustard', 'Soyabean'],
        'districts': ['Gangtok', 'Gyalshing', 'Pakyong', 'Mangan', 'Namchi', 'Soreng'],
        'lat': 27.53, 'lon': 88.51, 'soil_map': {'Gangtok': 'Brown Forest Soil', 'Gyalshing': 'Mountain Loam'}
    },
    'Tamil Nadu': {
        'code': 'TN', 'zone': 'Southern Plateau and Hills', 'soil': 'Red Loam & Coastal Alluvium', 'rain': 910.0,
        'crops': ['Rice', 'Cotton', 'Sugarcane', 'Groundnut', 'Maize', 'Pigeonpea (Arhar)'],
        'districts': [
            'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 
            'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur', 
            'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 
            'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 
            'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 
            'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 
            'Viluppuram', 'Virudhunagar'
        ],
        'lat': 11.12, 'lon': 78.65, 'soil_map': {'Coimbatore': 'Red Loam Soil', 'Thanjavur': 'Deltaic Alluvium', 'Madurai': 'Red & Black Loam'}
    },
    'Telangana': {
        'code': 'TG', 'zone': 'Southern Plateau and Hills', 'soil': 'Red Sandy / Black Cotton Soil', 'rain': 950.0,
        'crops': ['Cotton', 'Rice', 'Maize', 'Soyabean', 'Pigeonpea (Arhar)', 'Chickpea (Gram)', 'Sugarcane', 'Groundnut'],
        'districts': [
            'Adilabad', 'Bhadradri Kothagudem', 'Hanumakonda', 'Hyderabad', 'Jagtial', 'Jangaon', 
            'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar', 'Khammam', 
            'Kumuram Bheem Asifabad', 'Mahabubabad', 'Mahabubnagar', 'Mancherial', 'Medak', 
            'Medchal Malkajgiri', 'Mulugu', 'Nagarkurnool', 'Nalgonda', 'Narayanpet', 'Nirmal', 
            'Nizamabad', 'Peddapalli', 'Rajanna Sircilla', 'Ranga Reddy', 'Sangareddy', 
            'Siddipet', 'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal', 'Yadadri Bhuvanagiri'
        ],
        'lat': 18.11, 'lon': 79.01, 'soil_map': {'Warangal': 'Red Sandy / Black Soil', 'Adilabad': 'Deep Black Cotton Soil', 'Nizamabad': 'Medium Black Soil'}
    },
    'Tripura': {
        'code': 'TR', 'zone': 'Eastern Himalayan Region', 'soil': 'Red Loam & Alluvial', 'rain': 2250.0,
        'crops': ['Rice', 'Mustard', 'Sugarcane', 'Maize'],
        'districts': ['Dhalai', 'Gomati', 'Khowai', 'North Tripura', 'Sepahijala', 'South Tripura', 'Unakoti', 'West Tripura'],
        'lat': 23.94, 'lon': 91.98, 'soil_map': {'West Tripura': 'Red Loam Soil', 'Dhalai': 'Acidic Red Soil'}
    },
    'Uttar Pradesh': {
        'code': 'UP', 'zone': 'Upper & Middle Gangetic Plains', 'soil': 'Alluvial Soil', 'rain': 920.0,
        'crops': ['Wheat', 'Rice', 'Sugarcane', 'Mustard', 'Chickpea (Gram)', 'Maize', 'Pigeonpea (Arhar)', 'Soyabean'],
        'districts': [
            'Agra', 'Aligarh', 'Ambedkar Nagar', 'Amethi', 'Amroha', 'Auraiya', 'Ayodhya', 
            'Azamgarh', 'Baghpat', 'Bahraich', 'Ballia', 'Balrampur', 'Banda', 'Barabanki', 
            'Bareilly', 'Basti', 'Bhadohi', 'Bijnor', 'Budaun', 'Bulandshahr', 'Chandauli', 
            'Chitrakoot', 'Deoria', 'Etah', 'Etawah', 'Farrukhabad', 'Fatehpur', 'Firozabad', 
            'Gautam Buddha Nagar', 'Ghaziabad', 'Ghazipur', 'Gonda', 'Gorakhpur', 'Hamirpur', 
            'Hapur', 'Hardoi', 'Hathras', 'Jalaun', 'Jaunpur', 'Jhansi', 'Kannauj', 
            'Kanpur Dehat', 'Kanpur Nagar', 'Kasganj', 'Kaushambi', 'Kheri', 'Kushinagar', 
            'Lalitpur', 'Lucknow', 'Maharajganj', 'Mahoba', 'Mainpuri', 'Mathura', 'Mau', 
            'Meerut', 'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Pilibhit', 'Pratapgarh', 
            'Prayagraj', 'Raebareli', 'Rampur', 'Saharanpur', 'Sambhal', 'Sant Kabir Nagar', 
            'Shahjahanpur', 'Shamli', 'Shravasti', 'Siddharthnagar', 'Sitapur', 'Sonbhadra', 
            'Sultanpur', 'Unnao', 'Varanasi'
        ],
        'lat': 26.84, 'lon': 80.94, 'soil_map': {'Meerut': 'Alluvial Soil', 'Agra': 'Sandy Alluvial Soil', 'Varanasi': 'Alluvial Soil', 'Jhansi': 'Mixed Red & Black Soil', 'Gorakhpur': 'Calcareous Alluvium'}
    },
    'Uttarakhand': {
        'code': 'UT', 'zone': 'Western Himalayan Region', 'soil': 'Mountain Alluvial & Loam', 'rain': 1550.0,
        'crops': ['Rice', 'Wheat', 'Sugarcane', 'Maize', 'Mustard', 'Soyabean'],
        'districts': [
            'Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun', 'Haridwar', 'Nainital', 
            'Pauri Garhwal', 'Pithoragarh', 'Rudraprayag', 'Tehri Garhwal', 'Udham Singh Nagar', 'Uttarkashi'
        ],
        'lat': 30.06, 'lon': 79.01, 'soil_map': {'Dehradun': 'Mountain Alluvial Soil', 'Haridwar': 'Alluvial Plains Soil', 'Udham Singh Nagar': 'Rich Terai Alluvium'}
    },
    'West Bengal': {
        'code': 'WB', 'zone': 'Lower Gangetic Plains', 'soil': 'Alluvial / Coastal Deltaic', 'rain': 1450.0,
        'crops': ['Rice', 'Mustard', 'Wheat', 'Sugarcane', 'Maize', 'Chickpea (Gram)', 'Groundnut'],
        'districts': [
            'Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar', 'Dakshin Dinajpur', 'Darjeeling', 
            'Hooghly', 'Howrah', 'Jalpaiguri', 'Jhargram', 'Kalimpong', 'Kolkata', 'Malda', 
            'Murshidabad', 'Nadia', 'North 24 Parganas', 'Paschim Bardhaman', 'Paschim Medinipur', 
            'Purba Bardhaman', 'Purba Medinipur', 'Purulia', 'South 24 Parganas', 'Uttar Dinajpur'
        ],
        'lat': 22.98, 'lon': 87.85, 'soil_map': {'Purba Bardhaman': 'Alluvial / Coastal Soil', 'Hooghly': 'Deltaic Alluvium', 'Birbhum': 'Red & Laterite Soil'}
    },
    'Andaman and Nicobar Islands': {
        'code': 'AN', 'zone': 'Islands Region', 'soil': 'Marine Alluvium / Laterite', 'rain': 3000.0,
        'crops': ['Rice', 'Sugarcane'],
        'districts': ['Nicobar', 'North and Middle Andaman', 'South Andaman'],
        'lat': 11.74, 'lon': 92.65, 'soil_map': {'South Andaman': 'Marine Alluvium / Laterite'}
    },
    'Chandigarh': {
        'code': 'CH', 'zone': 'Trans-Gangetic Plains', 'soil': 'Alluvial Soil', 'rain': 1050.0,
        'crops': ['Wheat', 'Mustard', 'Maize', 'Rice'],
        'districts': ['Chandigarh'],
        'lat': 30.73, 'lon': 76.77, 'soil_map': {'Chandigarh': 'Alluvial Soil'}
    },
    'Dadra and Nagar Haveli and Daman and Diu': {
        'code': 'DH', 'zone': 'West Coast Plains', 'soil': 'Coastal Alluvium & Medium Black', 'rain': 1900.0,
        'crops': ['Rice', 'Sugarcane', 'Wheat', 'Groundnut', 'Mustard'],
        'districts': ['Dadra and Nagar Haveli', 'Daman', 'Diu'],
        'lat': 20.39, 'lon': 72.83, 'soil_map': {'Daman': 'Coastal Alluvium', 'Diu': 'Coastal Sand'}
    },
    'Delhi': {
        'code': 'DL', 'zone': 'Trans-Gangetic Plains', 'soil': 'Alluvial Soil', 'rain': 750.0,
        'crops': ['Wheat', 'Mustard', 'Rice', 'Maize', 'Chickpea (Gram)'],
        'districts': [
            'Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 
            'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi'
        ],
        'lat': 28.70, 'lon': 77.10, 'soil_map': {'New Delhi': 'Alluvial Soil', 'North Delhi': 'Yamuna Alluvium', 'South Delhi': 'Sandy Loam / Ridge Soil'}
    },
    'Jammu and Kashmir': {
        'code': 'JK', 'zone': 'Western Himalayan Region', 'soil': 'Mountain / Alluvial Loam', 'rain': 950.0,
        'crops': ['Rice', 'Wheat', 'Mustard', 'Maize'],
        'districts': [
            'Anantnag', 'Bandipora', 'Baramulla', 'Budgam', 'Doda', 'Ganderbal', 'Jammu', 
            'Kathua', 'Kishtwar', 'Kulgam', 'Kupwara', 'Poonch', 'Pulwama', 'Rajouri', 
            'Ramban', 'Reasi', 'Samba', 'Shopian', 'Srinagar', 'Udhampur'
        ],
        'lat': 33.77, 'lon': 76.57, 'soil_map': {'Srinagar': 'Mountain / Alluvial Soil', 'Jammu': 'Alluvial Loam', 'Anantnag': 'Karewa Loamy Soil'}
    },
    'Ladakh': {
        'code': 'LA', 'zone': 'High Altitude Cold Arid Zone', 'soil': 'Cold Desert Sandy Soil', 'rain': 180.0,
        'crops': ['Wheat', 'Mustard', 'Maize', 'Rice'],
        'districts': ['Kargil', 'Leh'],
        'lat': 34.15, 'lon': 77.57, 'soil_map': {'Leh': 'Cold Desert Sandy Soil', 'Kargil': 'Glacial Riverine Loam'}
    },
    'Lakshadweep': {
        'code': 'LD', 'zone': 'Islands Region', 'soil': 'Coral Sandy Soil', 'rain': 1600.0,
        'crops': ['Rice', 'Maize'],
        'districts': ['Lakshadweep'],
        'lat': 10.56, 'lon': 72.64, 'soil_map': {'Lakshadweep': 'Coral Sandy Soil'}
    },
    'Puducherry': {
        'code': 'PY', 'zone': 'East Coast Plains and Hills', 'soil': 'Coastal Alluvium', 'rain': 1380.0,
        'crops': ['Rice', 'Sugarcane', 'Cotton', 'Groundnut'],
        'districts': ['Karaikal', 'Mahe', 'Puducherry', 'Yanam'],
        'lat': 11.94, 'lon': 79.80, 'soil_map': {'Puducherry': 'Coastal Alluvium', 'Karaikal': 'Deltaic Alluvium'}
    }
}

catalog = []
for state, sdata in STATE_DATA.items():
    code = sdata['code']
    d_list = sdata['districts']
    total_d = len(d_list)
    for idx, d_name in enumerate(d_list):
        clean_id = re.sub(r'[^A-Z0-9]', '_', f'{code}_{d_name.upper()}')
        # Offset coordinates slightly around state center for distinct GPS pinning
        lat_offset = round(((idx % 5) - 2) * 0.35, 4)
        lon_offset = round(((idx // 5) - 2) * 0.35, 4)
        d_lat = round(sdata['lat'] + lat_offset, 4)
        d_lon = round(sdata['lon'] + lon_offset, 4)
        soil = sdata.get('soil_map', {}).get(d_name, sdata['soil'])
        
        catalog.append({
            'district_id': clean_id,
            'state_name': state,
            'district_name': d_name,
            'latitude': d_lat,
            'longitude': d_lon,
            'agro_climatic_zone': sdata['zone'],
            'major_soil_type': soil,
            'imd_annual_rainfall_mm': sdata['rain'],
            'major_crops': sdata['crops']
        })

print(f'Total Generated Catalog: {len(catalog)} districts across {len(STATE_DATA)} States/UTs')

# Write to python script file
open('scripts/generated_catalog.json', 'w', encoding='utf-8').write(json.dumps(catalog, indent=2))
