import React, { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard, Users, Send, FileText, BarChart3, Settings, LogOut,
  Search, Plus, Filter, Check, CheckCheck, X, ChevronRight, ChevronLeft,
  HelpCircle, ShieldCheck, ArrowRight, AlertTriangle, UserPlus,
  Eye, EyeOff, Sparkles, Sun, Moon
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  DESIGN TOKENS                                                      */
/*  Palette: Paper & Ink. White surfaces, gray-50 chrome, blue-600     */
/*  primary for CRM actions, green-500 reserved for WhatsApp states.   */
/*  Low-contrast outline borders instead of shadows. Inter throughout. */
/* ------------------------------------------------------------------ */

const Tokens = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');

    .crm-root {
      --bg: #FCFCFD;             /* surface-container-low / canvas */
      --surface: #FFFFFF;        /* surface-container-lowest */
      --surface-bright: #FAFBFC; /* table header / sidebar tint */
      --ink: #374151;            /* on-surface — softened from near-black */
      --muted: #6B7280;          /* on-surface-variant */
      --muted-2: #B0B7C3;        /* placeholder */
      --border: #EEF0F3;         /* outline-variant */
      --primary: #5B8DEF;        /* CRM actions — lighter, airier blue */
      --primary-soft: #F3F7FF;
      --accent: #4ADE9A;         /* WhatsApp states only — lighter mint green */
      --accent-soft: #F1FDF7;
      --danger: #F0837D;         /* softened coral instead of hard red */
      --danger-soft: #FEF5F4;
      --warning: #F6BB5C;        /* softened amber */
      --warning-soft: #FFFAF0;
      font-family: 'Inter', sans-serif;
      color: var(--ink);
      background: var(--bg);
      -webkit-font-smoothing: antialiased;
      transition: background-color .2s ease, color .2s ease;
    }
    .crm-root.dark {
      --bg: #14161C;
      --surface: #1B1E26;
      --surface-bright: #20232C;
      --ink: #E7E9EE;
      --muted: #9BA3B0;
      --muted-2: #5B6270;
      --border: #2C303A;
      --primary: #7DA6FF;
      --primary-soft: #223354;
      --accent: #5FE3AA;
      --accent-soft: #1B3A2E;
      --danger: #F49690;
      --danger-soft: #3A2426;
      --warning: #F7C777;
      --warning-soft: #3A311F;
    }
    .crm-mono { font-family: 'Inter', monospace; font-variant-numeric: tabular-nums; }

    /* Broad theme-switch transition: every surface fades between light/dark
       together, not just the root. Placed before the more specific rules
       below so their own transition lists (which fully replace this) can
       extend it rather than silently losing it. */
    .crm-root, .crm-root * {
      transition: background-color 260ms ease, border-color 260ms ease, color 260ms ease, fill 260ms ease, stroke 260ms ease;
    }

    .bg-surface { background: var(--surface); }
    .bg-bg { background: var(--bg); }
    .bg-ink { background: var(--ink); }
    .bg-primary { background: var(--primary); }
    .bg-primary-soft { background: var(--primary-soft); }
    .bg-accent { background: var(--accent); }
    .bg-accent-soft { background: var(--accent-soft); }
    .bg-danger-soft { background: var(--danger-soft); }
    .bg-warning-soft { background: var(--warning-soft); }
    .text-ink { color: var(--ink); }
    .text-muted { color: var(--muted); }
    .text-muted-2 { color: var(--muted-2); }
    .text-primary { color: var(--primary); }
    .text-accent { color: var(--accent); }
    .text-danger { color: var(--danger); }
    .text-warning { color: var(--warning); }
    .border-default { border-color: var(--border); }

    .crm-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
    }
    .crm-input {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      transition: background-color 260ms ease, border-color 150ms ease, color 260ms ease, box-shadow .15s ease;
    }
    .crm-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(91,141,239,0.12);
      outline: none;
    }
    .crm-btn-primary {
      background: var(--primary);
      color: #fff;
      border-radius: 8px;
      transition: background-color 260ms ease, opacity .15s ease, transform .12s ease, box-shadow .12s ease;
      box-shadow: 0 1px 2px rgba(91,141,239,0.15);
    }
    .crm-btn-primary:hover { opacity: 0.92; box-shadow: 0 4px 10px -3px rgba(91,141,239,0.35); }
    .crm-btn-primary:active { transform: scale(0.98); }
    .crm-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

    .crm-btn-secondary {
      background: var(--surface);
      color: var(--ink);
      border: 1px solid var(--border);
      border-radius: 8px;
      transition: background-color 260ms ease, border-color 260ms ease, color 260ms ease;
    }
    .crm-btn-secondary:hover { background: var(--surface-bright); }

    .crm-btn-accent {
      background: var(--accent);
      color: #fff;
      border-radius: 8px;
      transition: background-color 260ms ease, opacity .15s ease, box-shadow .12s ease;
      box-shadow: 0 1px 2px rgba(74,222,154,0.15);
    }
    .crm-btn-accent:hover { opacity: 0.9; box-shadow: 0 4px 10px -3px rgba(74,222,154,0.4); }
    .crm-btn-accent:active { transform: scale(0.98); }
    .crm-btn-accent:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

    .crm-nav-item {
      border-radius: 6px;
      transition: background-color 260ms ease, color 260ms ease;
    }
    .crm-nav-item-active {
      background: var(--accent-soft);
      color: var(--primary);
      font-weight: 700;
    }

    .crm-perspective { perspective: 800px; }
    nav.crm-scrollbar { perspective: 600px; }

    .crm-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
    .crm-scrollbar::-webkit-scrollbar-track { background: var(--surface-bright); }
    .crm-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
    .crm-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--muted-2); }

    /* Drawer open: smooth slide + fade + gentle scale settle, no overshoot. Close: quick reverse. */
    @keyframes drawer-in {
      from { transform: translateX(-24px) scale(0.98); opacity: 0; }
      to   { transform: translateX(0) scale(1); opacity: 1; }
    }
    @keyframes drawer-out {
      from { transform: translateX(0) scale(1); opacity: 1; }
      to   { transform: translateX(-24px) scale(0.98); opacity: 0; }
    }
    @keyframes backdrop-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes backdrop-out {
      from { opacity: 1; }
      to   { opacity: 0; }
    }
    .crm-drawer-in    { animation: drawer-in 260ms cubic-bezier(0.22, 1, 0.36, 1) both; }
    .crm-drawer-out   { animation: drawer-out 180ms cubic-bezier(0.4, 0, 1, 1) both; }
    .crm-backdrop-in  { animation: backdrop-in 260ms ease-out both; }
    .crm-backdrop-out { animation: backdrop-out 180ms ease-in both; }

    @keyframes popin { from { opacity: 0; transform: translateY(4px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

    /* Hamburger <-> X morph. Three bars rotate/fade into an X on .crm-burger-open. */
    .crm-burger { width: 20px; height: 16px; position: relative; display: inline-block; }
    .crm-burger span {
      position: absolute; left: 0; width: 100%; height: 2px; border-radius: 2px;
      background: currentColor;
      transition: transform 280ms cubic-bezier(0.65, 0, 0.35, 1), opacity 180ms ease, top 280ms cubic-bezier(0.65, 0, 0.35, 1), background-color 260ms ease;
    }
    .crm-burger span:nth-child(1) { top: 0; }
    .crm-burger span:nth-child(2) { top: 7px; }
    .crm-burger span:nth-child(3) { top: 14px; }
    .crm-burger-open span:nth-child(1) { top: 7px; transform: rotate(45deg); }
    .crm-burger-open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .crm-burger-open span:nth-child(3) { top: 7px; transform: rotate(-45deg); }

    a, button, input, select { font-family: inherit; }
    *:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
    @media (prefers-reduced-motion: reduce) {
      .crm-root * { transition: none !important; animation: none !important; }
      .crm-drawer-in, .crm-drawer-out, .crm-backdrop-in, .crm-backdrop-out { animation: none !important; }
    }
  `}</style>
);

/* ------------------------------------------------------------------ */
/*  ROUTE MAP                                                          */
/* ------------------------------------------------------------------ */

const ROUTES = [
  { key: "dashboard", path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["Sales / Support", "Administrator"] },
  { key: "contacts", path: "/contacts", label: "Contacts", icon: Users, roles: ["Sales / Support", "Administrator"] },
  { key: "campaigns", path: "/campaigns", label: "Campaigns", icon: Send, roles: ["Sales / Support", "Administrator"] },
  { key: "templates", path: "/templates", label: "Templates", icon: FileText, roles: ["Sales / Support", "Administrator"] },
  { key: "reports", path: "/reports", label: "Reports", icon: BarChart3, roles: ["Sales / Support", "Administrator"] },
  { key: "admin", path: "/admin", label: "Admin", icon: Settings, roles: ["Administrator"] },
];

/* ------------------------------------------------------------------ */
/*  MOCK DATA                                                          */
/* ------------------------------------------------------------------ */

// Single source of truth for the "State" field — all 28 Indian states plus the
// 8 union territories, so contact/campaign targeting covers the whole country,
// not just whichever names happened to be typed into the sample data.
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

// District list per state/UT. District boundaries in India change fairly often
// (Rajasthan, Andhra Pradesh and Chhattisgarh have all reorganised within the
// last few years), so treat this as a solid working list rather than a
// guaranteed-current government notification — easy to edit per state below.
const STATE_DISTRICTS = {
  "Andhra Pradesh": ["Srikakulam", "Parvathipuram Manyam", "Vizianagaram", "Visakhapatnam", "Anakapalli", "Alluri Sitharama Raju", "Kakinada", "East Godavari", "Konaseema", "West Godavari", "Eluru", "Krishna", "NTR", "Guntur", "Palnadu", "Bapatla", "Prakasam", "Nellore", "Kurnool", "Nandyal", "Anantapur", "Sri Sathya Sai", "YSR Kadapa", "Annamayya", "Chittoor", "Tirupati"],
  "Arunachal Pradesh": ["Tawang", "West Kameng", "East Kameng", "Papum Pare", "Kurung Kumey", "Kra Daadi", "Lower Subansiri", "Upper Subansiri", "West Siang", "Lower Siang", "Siang", "East Siang", "Upper Siang", "Dibang Valley", "Lower Dibang Valley", "Anjaw", "Lohit", "Namsai", "Changlang", "Tirap", "Longding", "Kamle", "Shi Yomi", "Leparada", "Pakke-Kessang"],
  "Assam": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Dima Hasao", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"],
  "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
  "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela-Pendra-Marwahi", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
  "Goa": ["North Goa", "South Goa"],
  "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udepur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
  "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
  "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahebganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"],
  "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Vijayanagara", "Yadgir"],
  "Kerala": ["Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"],
  "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Narmadapuram", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
  "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Chhatrapati Sambhajinagar", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Dharashiv", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  "Manipur": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
  "Meghalaya": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
  "Mizoram": ["Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saitual", "Serchhip", "Siaha"],
  "Nagaland": ["Chümoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Niuland", "Noklak", "Peren", "Phek", "Shamator", "Tuensang", "Tseminyu", "Wokha", "Zunheboto"],
  "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"],
  "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur", "Shaheed Bhagat Singh Nagar", "Tarn Taran"],
  "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
  "Sikkim": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim", "Pakyong", "Soreng"],
  "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
  "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Hanamkonda", "Yadadri Bhuvanagiri"],
  "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shrawasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
  "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
  "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"],
  "Andaman and Nicobar Islands": ["Nicobar", "North and Middle Andaman", "South Andaman"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli", "Daman", "Diu"],
  "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
  "Jammu and Kashmir": ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"],
  "Ladakh": ["Kargil", "Leh"],
  "Lakshadweep": ["Lakshadweep"],
  "Puducherry": ["Karaikal", "Mahe", "Puducherry", "Yanam"],
};

const initialContacts = [
  { id: "C-0231", name: "Rahul Krishnan", phone: "+91 98470 12233", segment: "Kerala", district: "Ernakulam", consent: "opted_in", lastActivity: "2 days ago" },
  { id: "C-0232", name: "Anjali Menon", phone: "+91 90480 55621", segment: "Karnataka", district: "Bengaluru Urban", consent: "opted_in", lastActivity: "5 hrs ago" },
  { id: "C-0233", name: "Suresh Nair", phone: "+91 94470 33110", segment: "Kerala", district: "Thiruvananthapuram", consent: "opted_out", lastActivity: "14 days ago" },
  { id: "C-0234", name: "Divya Prasad", phone: "+91 99610 88452", segment: "Tamil Nadu", district: "Chennai", consent: "opted_in", lastActivity: "1 day ago" },
  { id: "C-0235", name: "Manoj Pillai", phone: "+91 97460 21987", segment: "Maharashtra", district: "Mumbai City", consent: "opted_in", lastActivity: "3 hrs ago" },
  { id: "C-0236", name: "Fathima Rasheed", phone: "+91 96330 77410", segment: "Delhi", district: "South Delhi", consent: "pending", lastActivity: "just now" },
];

const initialTemplates = [
  { id: "T-101", name: "Order Confirmation", category: "Transactional", status: "approved", body: "Hi {{1}}, your order #{{2}} is confirmed and will ship within 2 business days." },
  { id: "T-102", name: "Festive Offer", category: "Marketing", status: "approved", body: "Celebrate the season with {{1}} — enjoy a limited-time offer on your next purchase." },
  { id: "T-103", name: "Payment Reminder", category: "Utility", status: "approved", body: "Hi {{1}}, a friendly reminder that invoice #{{2}} is due on {{3}}." },
  { id: "T-104", name: "New Catalogue Launch", category: "Marketing", status: "pending", body: "Our new catalogue is here, {{1}} — take a look before it goes live to everyone." },
];

const initialCampaigns = [
  { id: "CMP-014", name: "Seasonal Collection Launch", template: "Festive Offer", segment: "Kerala", status: "completed", recipients: 412, sent: 412, delivered: 398, read: 261, failed: 14 },
  { id: "CMP-015", name: "Wholesale Reminder Q3", template: "Payment Reminder", segment: "Tamil Nadu", status: "sending", recipients: 96, sent: 61, delivered: 54, read: 22, failed: 2 },
  { id: "CMP-016", name: "New Lead Welcome", template: "Order Confirmation", segment: "Karnataka", status: "queued", recipients: 58, sent: 0, delivered: 0, read: 0, failed: 0 },
];

const deliveryTrend = [
  { day: "Mon", delivered: 210, read: 140 },
  { day: "Tue", delivered: 260, read: 180 },
  { day: "Wed", delivered: 190, read: 120 },
  { day: "Thu", delivered: 305, read: 220 },
  { day: "Fri", delivered: 340, read: 260 },
  { day: "Sat", delivered: 190, read: 110 },
  { day: "Sun", delivered: 150, read: 90 },
];

const consentColors = { opted_in: "#4ADE9A", opted_out: "#F0837D", pending: "#F6BB5C" };
const consentSplit = [
  { name: "Opted in", key: "opted_in", value: initialContacts.filter(c => c.consent === "opted_in").length },
  { name: "Pending", key: "pending", value: initialContacts.filter(c => c.consent === "pending").length },
  { name: "Opted out", key: "opted_out", value: initialContacts.filter(c => c.consent === "opted_out").length },
];

const initialUsers = [
  { id: "U-01", name: "Meera Suresh", role: "Administrator", email: "meera@client.internal", status: "active" },
  { id: "U-02", name: "Vishnu Raghavan", role: "Sales / Support", email: "vishnu@client.internal", status: "active" },
  { id: "U-03", name: "Karthika Mohan", role: "Sales / Support", email: "karthika@client.internal", status: "invited" },
];

/* ------------------------------------------------------------------ */
/*  SHARED UI PRIMITIVES                                                */
/* ------------------------------------------------------------------ */

function Badge({ tone = "muted", children }) {
  const tones = {
    muted: "bg-bg text-muted border border-default",
    accent: "bg-accent-soft text-accent border border-accent/20",
    danger: "bg-danger-soft text-danger border border-danger/20",
    warning: "bg-warning-soft text-warning border border-warning/20",
    info: "bg-primary-soft text-primary border border-primary/20",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[12px] font-medium ${tones[tone]}`}>
      {(tone === "accent" || tone === "warning" || tone === "danger" || tone === "info") && (
        <span className="w-1.5 h-1.5 rounded-full" style={{
          background: tone === "accent" ? "#4ADE9A" : tone === "warning" ? "#F6BB5C" : tone === "danger" ? "#F0837D" : "#5B8DEF"
        }} />
      )}
      {children}
    </span>
  );
}

function ConsentBadge({ consent }) {
  if (consent === "opted_in") return <Badge tone="accent">Opted In</Badge>;
  if (consent === "opted_out") return <Badge tone="muted">Opted Out</Badge>;
  return <Badge tone="warning">Pending</Badge>;
}

function CampaignStatusBadge({ status }) {
  if (status === "completed") return <Badge tone="accent">Completed</Badge>;
  if (status === "sending") return <Badge tone="warning">Sending</Badge>;
  if (status === "queued") return <Badge tone="info">Queued</Badge>;
  if (status === "failed") return <Badge tone="danger">Failed</Badge>;
  return <Badge tone="muted">Draft</Badge>;
}

function Toast({ message, onClose }) {
  React.useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-5 right-5 z-50 crm-card bg-ink text-white px-4 py-3 flex items-center gap-2 shadow-lg border-0">
      <CheckCheck size={16} className="text-accent" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

function PageHeader({ title, subtitle, onMenuClick, menuOpen }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <button
        onClick={onMenuClick}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={!!menuOpen}
        style={{ padding: 10, marginLeft: -10, marginTop: -2, color: "var(--ink)", flexShrink: 0, background: "none", border: "none", cursor: "pointer", borderRadius: 6 }}
      >
        <span className={`crm-burger ${menuOpen ? "crm-burger-open" : ""}`}>
          <span /><span /><span />
        </span>
      </button>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  /login                                                             */
/* ------------------------------------------------------------------ */

function ForgotPasswordPanel({ role, onBack }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);

  if (verified) {
    return (
      <div className="text-center py-4 animate-[fadein_.3s_ease]">
        <div className="w-12 h-12 rounded-full bg-accent-soft flex items-center justify-center mx-auto mb-3">
          <CheckCheck size={22} className="text-accent" />
        </div>
        <p className="font-medium mb-1">Identity verified</p>
        <p className="text-sm text-muted mb-5">A password reset link has been sent to {email || "your email"}. Check your inbox to continue.</p>
        <button onClick={onBack} className="crm-btn-primary w-full py-2.5 text-sm font-medium">Back to sign in</button>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="animate-[fadein_.3s_ease]">
        <p className="text-sm font-medium mb-1">Enter verification code</p>
        <p className="text-xs text-muted mb-5">We sent a 6-digit code to {email || "your email"}.</p>
        <input
          value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000" maxLength={6}
          className="crm-input w-full px-3 py-2.5 text-center text-lg tracking-[0.5em] mb-4"
        />
        <button
          disabled={code.length !== 6}
          onClick={() => setVerified(true)}
          className="crm-btn-accent w-full py-2.5 text-sm font-medium disabled:opacity-40"
        >
          Verify code
        </button>
        <p className="text-xs text-muted-2 text-center mt-4">Didn't get it? <button onClick={() => setSent(false)} className="text-ink font-medium hover:underline">Resend</button></p>
      </div>
    );
  }

  return (
    <div className="animate-[fadein_.3s_ease]">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted mb-4 hover:text-ink">
        <ChevronLeft size={13} /> Back to sign in
      </button>
      <p className="text-sm font-medium mb-1">Reset your password</p>
      <p className="text-xs text-muted mb-5">Enter the work email linked to your {role} account and we'll send a verification code.</p>
      <label className="block text-xs font-medium text-muted mb-1.5">Work email</label>
      <input
        value={email} onChange={e => setEmail(e.target.value)}
        placeholder="you@client.internal"
        className="crm-input w-full px-3 py-2.5 text-sm mb-5"
      />
      <button
        disabled={!email.includes("@")}
        onClick={() => setSent(true)}
        className="crm-btn-primary w-full py-2.5 text-sm font-medium disabled:opacity-40"
      >
        Send verification code
      </button>
    </div>
  );
}

function RoleCredentialFields({ role, onLogin, onForgot }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const accentColor = role === "Administrator" ? "#5B8DEF" : "#4ADE9A";
  const btnClass = role === "Administrator" ? "crm-btn-primary" : "crm-btn-accent";

  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1.5">Full Name</label>
      <input
        value={name} onChange={e => setName(e.target.value)}
        placeholder="John Doe"
        className="crm-input w-full px-3 py-2.5 text-sm mb-4"
      />
      <label className="block text-xs font-medium text-muted mb-1.5">Work Email</label>
      <input
        value={email} onChange={e => setEmail(e.target.value)}
        placeholder="john.doe@bharatinfotechs.com"
        className="crm-input w-full px-3 py-2.5 text-sm mb-4"
      />
      <label className="block text-xs font-medium text-muted mb-1.5">Password</label>
      <div className="relative mb-2">
        <input
          type={showPw ? "text" : "password"}
          value={password} onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="crm-input w-full px-3 py-2.5 text-sm pr-10"
        />
        <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-2">
          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      <div className="flex items-center justify-between mb-5">
        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
          <input type="checkbox" defaultChecked className="w-3.5 h-3.5 rounded border-default" style={{ accentColor }} />
          Remember me
        </label>
        <button onClick={onForgot} className="text-xs font-medium hover:underline" style={{ color: accentColor }}>Forgot password?</button>
      </div>
      <button
        onClick={() => onLogin({ name: name.trim() || email.split("@")[0] || "Staff User", role })}
        className={`${btnClass} w-full py-2.5 text-sm font-medium flex items-center justify-center gap-2`}
      >
        Sign in as {role} <ArrowRight size={15} />
      </button>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [role, setRole] = useState("Administrator");
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleRoleSwitch = (r) => {
    if (r === role) return;
    setForgotOpen(false);
    setRole(r);
  };

  return (
    <div className="crm-root min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ background: "var(--bg)" }}>
      <style>{`
        @keyframes fadein { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fieldsin { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div className="w-full max-w-sm crm-perspective">
        <TiltCard maxTilt={3} className="crm-card p-6 sm:p-7">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-primary">Bharat Infotechs</h1>
            <p className="text-sm text-muted mt-1">Business Console</p>
          </div>

          <div className="flex border-b border-default mb-6">
            {["Administrator", "Sales / Support"].map(r => (
              <button
                key={r}
                onClick={() => handleRoleSwitch(r)}
                className={`flex-1 text-sm py-2.5 font-medium border-b-2 -mb-px transition-colors ${
                  role === r ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div key={role + forgotOpen} style={{ animation: "fieldsin 320ms cubic-bezier(0.16,1,0.3,1) both" }}>
            {forgotOpen ? (
              <ForgotPasswordPanel role={role} onBack={() => setForgotOpen(false)} />
            ) : (
              <RoleCredentialFields role={role} onLogin={onLogin} onForgot={() => setForgotOpen(true)} />
            )}
          </div>
        </TiltCard>

        <p className="text-xs text-muted-2 text-center mt-6">
          Prototype — sign-in and email verification are simulated, nothing is sent.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar / Shell                                                    */
/* ------------------------------------------------------------------ */

function SidebarContents({ items, active, setActive, user, onLogout, onNavigate, onCloseClick, dark, setDark }) {
  const [supportOpen, setSupportOpen] = useState(false);
  const supportRef = useRef(null);
  useEffect(() => {
    if (!supportOpen) return;
    const onClickOutside = (e) => {
      if (supportRef.current && !supportRef.current.contains(e.target)) setSupportOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [supportOpen]);

  return (
    <>
      <div style={{ marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "0 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 6, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
            BI
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", margin: 0, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Bharat Infotechs</h1>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Business Console</p>
          </div>
        </div>
        {onCloseClick && (
          <button onClick={onCloseClick} style={{ padding: 4, color: "var(--muted)", flexShrink: 0, background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="crm-scrollbar" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map(item => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <TiltNavItem
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`crm-nav-item w-full flex items-center gap-3 px-3 py-2 text-sm ${
                isActive ? "crm-nav-item-active" : "text-muted hover:bg-bg hover:text-ink"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span className={isActive ? "font-bold" : "font-medium"}>{item.label}</span>
            </TiltNavItem>
          );
        })}
      </nav>

      <div style={{ paddingTop: 16, marginTop: 16, borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "0 4px" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, margin: 0, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</p>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.role}</p>
          </div>
        </div>

        <button
          onClick={() => setDark(d => !d)}
          role="switch"
          aria-checked={dark}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 12px", marginBottom: 8, borderRadius: 6, border: "1px solid var(--border)",
            background: "var(--bg)", color: "var(--ink)", fontSize: 13, cursor: "pointer"
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {dark ? <Moon size={15} /> : <Sun size={15} />}
            {dark ? "Dark mode" : "Light mode"}
          </span>
          <span style={{
            position: "relative", width: 34, height: 18, borderRadius: 999,
            background: dark ? "var(--primary)" : "var(--border)", transition: "background .18s ease", flexShrink: 0
          }}>
            <span style={{
              position: "absolute", top: 2, left: dark ? 18 : 2, width: 14, height: 14, borderRadius: "50%",
              background: "#fff", transition: "left .18s cubic-bezier(0.4,0,0.2,1)", boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
            }} />
          </span>
        </button>

        <div style={{ position: "relative" }} ref={supportRef}>
          <button
            onClick={() => setSupportOpen(o => !o)}
            className="crm-nav-item w-full flex items-center gap-3 px-3 py-2 text-sm text-muted hover:bg-bg hover:text-ink"
          >
            <HelpCircle size={16} /> Support
          </button>
          {supportOpen && (
            <div
              style={{
                position: "absolute", bottom: "calc(100% + 6px)", left: 0, width: 240,
                background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8,
                boxShadow: "0 10px 30px -8px rgba(0,0,0,0.25)", padding: 14, zIndex: 50,
                animation: "popin 160ms ease-out both"
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px", color: "var(--ink)" }}>Need a hand?</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "var(--muted)" }}>
                <a href="mailto:support@bharatinfotechs.com" style={{ color: "var(--primary)", textDecoration: "none" }}>
                  support@bharatinfotechs.com
                </a>
                <span>Mon–Sat, 10am–6pm IST</span>
              </div>
            </div>
          )}
        </div>
        <button onClick={onLogout} className="crm-nav-item w-full flex items-center gap-3 px-3 py-2 text-sm text-muted hover:bg-bg hover:text-ink">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </>
  );
}

function Sidebar({ active, setActive, user, onLogout, mobileOpen, setMobileOpen, dark, setDark }) {
  const items = ROUTES.filter(r => r.roles.includes(user.role));
  const navigate = (key) => { setActive(key); setMobileOpen(false); };

  // Stay mounted a beat past close so the exit animation can finish playing.
  const [rendered, setRendered] = useState(mobileOpen);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (mobileOpen) {
      setRendered(true);
      setClosing(false);
    } else if (rendered) {
      setClosing(true);
      const t = setTimeout(() => { setRendered(false); setClosing(false); }, 180);
      return () => clearTimeout(t);
    }
  }, [mobileOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!rendered) return null;
  return (
    <>
      <div
        onClick={() => setMobileOpen(false)}
        className={closing ? "crm-backdrop-out" : "crm-backdrop-in"}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 30 }}
      />
      <aside
        className={`bg-surface border-r border-default crm-scrollbar ${closing ? "crm-drawer-out" : "crm-drawer-in"}`}
        style={{
          position: "fixed", top: 0, left: 0, height: "100vh", width: "min(288px, 85vw)",
          zIndex: 40, display: "flex", flexDirection: "column", padding: "24px 16px",
          overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)"
        }}
      >
        <SidebarContents items={items} active={active} setActive={setActive} user={user} onLogout={onLogout} onNavigate={navigate} onCloseClick={() => setMobileOpen(false)} dark={dark} setDark={setDark} />
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  /dashboard                                                         */
/* ------------------------------------------------------------------ */

function TiltCard({ className = "", maxTilt = 4, children, ...rest }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({ transform: "rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)" });

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const rotateY = ((x - midX) / midX) * maxTilt;
    const rotateX = -((y - midY) / midY) * maxTilt;
    setStyle({
      transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(3px) scale(1.008)`,
      boxShadow: `${-rotateY * 1.2}px ${rotateX * 1.2 + 6}px 20px -8px rgba(0,0,0,0.16)`,
    });
  };

  const handleLeave = () => {
    setStyle({ transform: "rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)", boxShadow: "none" });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ ...style, transformStyle: "preserve-3d", willChange: "transform" }}
      className={className}
      {...rest}
    >
      {children}
    </div>
  );
}

function TiltNavItem({ isActive, onClick, children, className = "" }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({ transform: "rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)" });

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const rotateY = ((x - midX) / midX) * 6;
    const rotateX = -((y - midY) / midY) * 6;
    setStyle({
      transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(4px) scale(1.015)`,
      boxShadow: `${-rotateY * 0.8}px ${rotateX * 0.8 + 4}px 14px -6px rgba(0,0,0,0.18)`,
    });
  };

  const handleLeave = () => {
    setStyle({ transform: "rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)", boxShadow: "none" });
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ ...style, transformStyle: "preserve-3d", willChange: "transform" }}
      className={className}
    >
      {children}
    </button>
  );
}

function KpiCard({ label, value, delta, tone = "accent", icon: Icon }) {
  return (
    <TiltCard className="crm-card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
        {Icon && <Icon size={16} className="text-muted-2" />}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
      </div>
      {delta && <p className={`text-xs mt-1.5 ${tone === "danger" ? "text-danger" : "text-accent"}`}>{delta}</p>}
    </TiltCard>
  );
}

function Dashboard({ contacts, campaigns, onMenuClick, menuOpen, dark }) {
  const optedIn = contacts.filter(c => c.consent === "opted_in").length;
  const active = campaigns.filter(c => c.status === "sending" || c.status === "queued").length;
  const totalSent = campaigns.reduce((a, c) => a + c.sent, 0);
  const totalDelivered = campaigns.reduce((a, c) => a + c.delivered, 0);
  const rate = totalSent ? Math.round((totalDelivered / totalSent) * 100) : 0;
  const totalConsent = consentSplit.reduce((a, c) => a + c.value, 0) || 1;

  return (
    <div>
      <PageHeader title="Dashboard Overview" subtitle="Real-time metrics and campaign performance." onMenuClick={onMenuClick} menuOpen={menuOpen} />

      <div className="crm-perspective grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Contacts Opted In" value={optedIn} delta={`↗ +4.2% this week`} icon={Users} />
        <KpiCard label="Active Campaigns" value={active} delta="scheduled today" icon={Send} />
        <KpiCard label="Delivery Rate" value={`${rate}%`} delta="↗ +0.5% vs last month" icon={CheckCheck} />
        <KpiCard label="Failed Sends" value={campaigns.reduce((a, c) => a + c.failed, 0)} tone="danger" delta="⚠ Requires attention" icon={AlertTriangle} />
      </div>

      <div className="grid lg:grid-cols-5 gap-3 mb-4">
        <div className="lg:col-span-3 crm-card p-6">
          <p className="text-lg font-semibold mb-4">Delivery Performance</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={deliveryTrend}>
              <CartesianGrid stroke={dark ? "#2C303A" : "#EEF0F3"} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: dark ? "#5B6270" : "#B0B7C3" }} axisLine={{ stroke: dark ? "#2C303A" : "#EEF0F3" }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: dark ? "#5B6270" : "#B0B7C3" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${dark ? "#2C303A" : "#EEF0F3"}`, background: dark ? "#1B1E26" : "#FFFFFF", color: dark ? "#E7E9EE" : "#374151" }} />
              <Line type="monotone" dataKey="delivered" stroke="#5B8DEF" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="read" stroke="#4ADE9A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2 text-xs text-muted"><span className="w-3 h-3 rounded-full bg-primary" />Delivered</div>
            <div className="flex items-center gap-2 text-xs text-muted"><span className="w-3 h-3 rounded-full bg-accent" />Read</div>
          </div>
        </div>

        <div className="lg:col-span-2 crm-card p-6 flex flex-col items-center justify-center">
          <p className="text-lg font-semibold w-full text-left mb-6">Consent Status</p>
          <div
            className="relative w-40 h-40 rounded-full flex items-center justify-center"
            style={{ background: `conic-gradient(${consentSplit.map((c, i) => {
              const start = consentSplit.slice(0, i).reduce((a, s) => a + s.value, 0) / totalConsent * 100;
              const end = start + (c.value / totalConsent * 100);
              return `${consentColors[c.key]} ${start}% ${end}%`;
            }).join(", ")})` }}
          >
            <div className="w-28 h-28 bg-surface rounded-full flex flex-col items-center justify-center">
              <span className="text-xl font-bold">{totalConsent}</span>
              <span className="text-xs text-muted">Total</span>
            </div>
          </div>
          <div className="w-full mt-6 space-y-2.5">
            {consentSplit.map(c => (
              <div key={c.key} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded" style={{ background: consentColors[c.key] }} />
                  <span className="text-muted">{c.name}</span>
                </div>
                <span className="font-bold">{Math.round(c.value / totalConsent * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="crm-card overflow-hidden">
        <div className="p-4 border-b border-default flex justify-between items-center bg-surface-bright">
          <p className="text-lg font-semibold">Recent Campaigns</p>
          <button className="text-xs font-medium text-primary hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto crm-scrollbar">
          <table className="w-full text-sm min-w-[600px] border-collapse">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-default bg-surface-bright uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Campaign Name</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Sent</th>
                <th className="px-4 py-3 font-medium text-right">Delivered</th>
                <th className="px-4 py-3 font-medium text-right">Read</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-surface-bright transition-colors">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3"><CampaignStatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-right crm-mono">{c.sent || c.recipients}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 justify-end crm-mono">{c.delivered}<CheckCheck size={14} className="text-muted-2" /></span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 justify-end crm-mono">{c.read}<CheckCheck size={14} className="text-primary" /></span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  /contacts                                                          */
/* ------------------------------------------------------------------ */

function AddContactPanel({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", phone: "", segment: "Kerala", district: STATE_DISTRICTS["Kerala"][0], consent: "pending" });

  const handleStateChange = (newState) => {
    // Reset district to the new state's first option whenever state changes,
    // so it's never left pointing at a district from the previous state.
    setForm({ ...form, segment: newState, district: STATE_DISTRICTS[newState][0] });
  };

  return (
    <div className="crm-card p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold flex items-center gap-2"><UserPlus size={15} /> Add contact</p>
        <button onClick={onClose} className="text-muted hover:text-ink"><X size={16} /></button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs text-muted mb-1">Full name</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="crm-input w-full px-3 py-2 text-sm" placeholder="e.g. Priya Warrier" />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Phone</label>
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
            className="crm-input w-full px-3 py-2 text-sm" placeholder="+91 90000 00000" />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">State</label>
          <select value={form.segment} onChange={e => handleStateChange(e.target.value)}
            className="crm-input w-full px-3 py-2 text-sm">
            {INDIAN_STATES.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">District</label>
          <select value={form.district} onChange={e => setForm({ ...form, district: e.target.value })}
            className="crm-input w-full px-3 py-2 text-sm">
            {STATE_DISTRICTS[form.segment].map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Consent status</label>
          <select value={form.consent} onChange={e => setForm({ ...form, consent: e.target.value })}
            className="crm-input w-full px-3 py-2 text-sm">
            <option value="pending">Pending</option><option value="opted_in">Opted in</option><option value="opted_out">Opted out</option>
          </select>
        </div>
      </div>
      <button disabled={!form.name || !form.phone} onClick={() => { onAdd(form); onClose(); }}
        className="crm-btn-primary px-4 py-2 text-sm disabled:opacity-40">
        Save contact
      </button>
    </div>
  );
}

function Contacts({ contacts, setContacts, notify, onMenuClick, menuOpen }) {
  const [query, setQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("All");
  const [consentFilter, setConsentFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  useEffect(() => {
    if (!filterOpen) return;
    const onClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [filterOpen]);

  const segments = ["All", ...INDIAN_STATES];
  const consentOptions = [
    { value: "All", label: "All" },
    { value: "opted_in", label: "Opted in" },
    { value: "opted_out", label: "Opted out" },
    { value: "pending", label: "Pending" },
  ];
  const filtered = contacts.filter(c =>
    (segmentFilter === "All" || c.segment === segmentFilter) &&
    (consentFilter === "All" || c.consent === consentFilter) &&
    (c.name.toLowerCase().includes(query.toLowerCase()) || c.phone.includes(query))
  );
  const optedInCount = contacts.filter(c => c.consent === "opted_in").length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <PageHeader title="Contacts Directory" subtitle="Manage and segment your WhatsApp customer base." onMenuClick={onMenuClick} menuOpen={menuOpen} />
        <div className="flex gap-2 shrink-0">
          <div style={{ position: "relative" }} ref={filterRef}>
            <button
              onClick={() => setFilterOpen(o => !o)}
              className="crm-btn-secondary flex items-center gap-2 px-4 py-2 text-sm font-medium"
            >
              <Filter size={15} /> Filter
              {consentFilter !== "All" && (
                <span style={{
                  width: 16, height: 16, borderRadius: "50%", background: "var(--primary)", color: "#fff",
                  fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center"
                }}>1</span>
              )}
            </button>
            {filterOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, width: 200, maxWidth: "calc(100vw - 32px)",
                background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8,
                boxShadow: "0 10px 30px -8px rgba(0,0,0,0.25)", padding: 10, zIndex: 50,
                animation: "popin 160ms ease-out both"
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.4, margin: "2px 4px 8px" }}>
                  Consent status
                </p>
                {consentOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setConsentFilter(opt.value); setFilterOpen(false); }}
                    className="crm-nav-item w-full flex items-center justify-between px-3 py-2 text-sm text-muted hover:bg-bg hover:text-ink"
                    style={consentFilter === opt.value ? { color: "var(--primary)", fontWeight: 600, background: "var(--primary-soft)" } : undefined}
                  >
                    {opt.label}
                    {consentFilter === opt.value && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setShowAdd(s => !s)} className="crm-btn-primary flex items-center gap-2 px-4 py-2 text-sm font-medium">
            <UserPlus size={15} /> Add contact
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="crm-card px-4 py-3 flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <div><p className="text-[10px] text-muted uppercase tracking-wide">Total</p><p className="font-bold">{contacts.length.toLocaleString()}</p></div>
        </div>
        <div className="crm-card px-4 py-3 flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <div><p className="text-[10px] text-muted uppercase tracking-wide">Opted In</p><p className="font-bold">{optedInCount.toLocaleString()}</p></div>
        </div>
        <div className="crm-card flex-1 flex items-center overflow-x-auto crm-scrollbar">
          {segments.map(s => (
            <button key={s} onClick={() => setSegmentFilter(s)}
              className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 -mb-px ${segmentFilter === s ? "border-primary text-primary font-medium bg-primary-soft" : "border-transparent text-muted hover:text-ink"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-2" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name or phone"
          className="crm-input w-full pl-9 pr-3 py-2 text-sm" />
      </div>

      {showAdd && (
        <AddContactPanel onClose={() => setShowAdd(false)} onAdd={(f) => {
          setContacts(prev => [{ id: `C-0${240 + prev.length}`, name: f.name, phone: f.phone, segment: f.segment, district: f.district, consent: f.consent, lastActivity: "just now" }, ...prev]);
          notify(`${f.name} added to contacts`);
        }} />
      )}

      <div className="crm-card overflow-x-auto crm-scrollbar">
        <table className="w-full text-sm min-w-[620px] border-collapse">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-default bg-surface-bright uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">State</th>
              <th className="px-4 py-3 font-medium">District</th>
              <th className="px-4 py-3 font-medium">Consent Status</th>
              <th className="px-4 py-3 font-medium">Last Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-default">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-surface-bright transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary-soft text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                      {c.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                    </span>
                    <span className="font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 crm-mono text-xs text-muted">{c.phone}</td>
                <td className="px-4 py-3"><Badge tone="muted">{c.segment}</Badge></td>
                <td className="px-4 py-3 text-sm text-muted">{c.district || "—"}</td>
                <td className="px-4 py-3"><ConsentBadge consent={c.consent} /></td>
                <td className="px-4 py-3 text-muted text-xs">{c.lastActivity}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted text-sm">No contacts match this search.</td></tr>}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-default text-xs text-muted">
          <span>Showing 1-{filtered.length} of {contacts.length.toLocaleString()} contacts</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  /campaigns                                                         */
/* ------------------------------------------------------------------ */

function NewCampaignWizard({ contacts, templates, onClose, onLaunch }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [segment, setSegment] = useState("Ernakulam");
  const [templateId, setTemplateId] = useState(templates.find(t => t.status === "approved")?.id || "");
  const segments = INDIAN_STATES;
  const eligible = contacts.filter(c => c.segment === segment && c.consent === "opted_in");
  const excluded = contacts.filter(c => c.segment === segment && c.consent !== "opted_in").length;
  const template = templates.find(t => t.id === templateId);
  const steps = ["State", "Template", "Preview", "Launch"];

  return (
    <div className="crm-card p-5 mb-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-semibold flex items-center gap-2"><Sparkles size={15} className="text-primary" /> New campaign</p>
        <button onClick={onClose} className="text-muted hover:text-ink"><X size={16} /></button>
      </div>

      <div className="flex items-center gap-2 mb-6 text-xs">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 ${step === i + 1 ? "text-ink font-medium" : step > i + 1 ? "text-muted" : "text-muted-2"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${step > i + 1 ? "bg-accent text-white border-accent" : step === i + 1 ? "border-primary text-primary" : "border-default"}`}>
                {step > i + 1 ? <Check size={11} /> : i + 1}
              </span>
              {s}
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-px" style={{ background: "#EEF0F3" }} />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <div>
          <label className="block text-xs text-muted mb-1">Campaign name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Seasonal Collection Launch"
            className="crm-input w-full px-3 py-2 text-sm mb-4" />
          <label className="block text-xs text-muted mb-1">State</label>
          <select value={segment} onChange={e => setSegment(e.target.value)} className="crm-input w-full px-3 py-2 text-sm mb-2">
            {segments.map(s => <option key={s}>{s}</option>)}
          </select>
          <p className="text-xs text-muted">{eligible.length} contacts eligible (opted in). {excluded > 0 && `${excluded} excluded — no consent on record.`}</p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-2">
          {templates.map(t => (
            <button key={t.id} disabled={t.status !== "approved"} onClick={() => setTemplateId(t.id)}
              className={`w-full text-left border rounded-lg px-3 py-2.5 flex items-center justify-between text-sm transition-colors
                ${templateId === t.id ? "border-primary bg-primary-soft" : "border-default"} ${t.status !== "approved" ? "opacity-40 cursor-not-allowed" : "hover:border-muted-2"}`}>
              <div><p className="font-medium">{t.name}</p><p className="text-xs text-muted">{t.category}</p></div>
              {t.status === "approved" ? <Badge tone="accent">Approved</Badge> : <Badge tone="warning">Pending review</Badge>}
            </button>
          ))}
          <p className="text-xs text-muted pt-1">Only provider-approved templates can be used for a bulk send.</p>
        </div>
      )}

      {step === 3 && template && (
        <div>
          <p className="text-xs text-muted mb-2">Message preview</p>
          <div className="bg-bg border border-default rounded-lg p-4 max-w-sm mb-4">
            <p className="text-xs text-muted mb-1">{template.name}</p>
            <p className="text-sm">{template.body}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="border border-default rounded-lg px-3 py-2">
              <p className="text-xs text-muted">Recipients</p><p className="font-medium">{eligible.length} contacts</p>
            </div>
            <div className="border border-default rounded-lg px-3 py-2">
              <p className="text-xs text-muted">State</p><p className="font-medium">{segment}</p>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="text-center py-6">
          <CheckCheck size={30} className="text-accent mx-auto mb-3" />
          <p className="font-medium mb-1">Ready to queue "{name || "Untitled campaign"}"</p>
          <p className="text-sm text-muted">{eligible.length} messages will be queued and sent at a rate-limited pace.</p>
        </div>
      )}

      <div className="flex justify-between mt-6 pt-4 border-t border-default">
        <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
          className="flex items-center gap-1 text-sm text-muted disabled:opacity-30 px-3 py-2">
          <ChevronLeft size={15} /> Back
        </button>
        {step < 4 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={(step === 1 && (!name || eligible.length === 0)) || (step === 2 && !templateId)}
            className="crm-btn-primary flex items-center gap-1 px-4 py-2 text-sm disabled:opacity-40">
            Continue <ChevronRight size={15} />
          </button>
        ) : (
          <button onClick={() => onLaunch({ name: name || "Untitled campaign", segment, template: template.name, recipients: eligible.length })}
            className="crm-btn-accent flex items-center gap-2 px-4 py-2 text-sm">
            <Send size={14} /> Launch campaign
          </button>
        )}
      </div>
    </div>
  );
}

function Campaigns({ contacts, templates, campaigns, setCampaigns, notify, onMenuClick, menuOpen }) {
  const [showWizard, setShowWizard] = useState(false);
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <PageHeader title="Campaigns" subtitle="State-based sends, queued and rate-limited." onMenuClick={onMenuClick} menuOpen={menuOpen} />
        <button onClick={() => setShowWizard(s => !s)} className="crm-btn-primary flex items-center gap-2 px-4 py-2 text-sm font-medium shrink-0">
          <Plus size={15} /> New campaign
        </button>
      </div>
      {showWizard && (
        <NewCampaignWizard contacts={contacts} templates={templates} onClose={() => setShowWizard(false)}
          onLaunch={(payload) => {
            setCampaigns(prev => [{ id: `CMP-0${17 + prev.length}`, name: payload.name, template: payload.template, segment: payload.segment, status: "queued", recipients: payload.recipients, sent: 0, delivered: 0, read: 0, failed: 0 }, ...prev]);
            notify(`"${payload.name}" queued for ${payload.recipients} recipients`);
            setShowWizard(false);
          }} />
      )}
      <div className="crm-perspective grid gap-3">
        {campaigns.map(c => {
          const pct = c.recipients ? Math.round((c.sent / c.recipients) * 100) : 0;
          return (
            <TiltCard key={c.id} maxTilt={2.5} className="crm-card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="crm-mono text-xs text-muted">{c.id}</span>
                    <CampaignStatusBadge status={c.status} />
                  </div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted mt-0.5">{c.template} · {c.segment}</p>
                </div>
                <div className="flex gap-4 text-xs">
                  <div className="text-center"><p className="text-muted">Sent</p><p className="crm-mono">{c.sent}</p></div>
                  <div className="text-center"><p className="text-muted">Delivered</p><p className="crm-mono text-accent">{c.delivered}</p></div>
                  <div className="text-center"><p className="text-muted">Read</p><p className="crm-mono text-primary">{c.read}</p></div>
                  <div className="text-center"><p className="text-muted">Failed</p><p className="crm-mono text-danger">{c.failed}</p></div>
                </div>
              </div>
              {c.status !== "draft" && (
                <div className="mt-3 h-1.5 bg-bg rounded-full overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
              )}
            </TiltCard>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  /templates                                                         */
/* ------------------------------------------------------------------ */

function Templates({ templates, onMenuClick, menuOpen }) {
  return (
    <div>
      <PageHeader title="Templates" subtitle="Approval happens with the WhatsApp provider — this is the reference library." onMenuClick={onMenuClick} menuOpen={menuOpen} />
      <div className="crm-perspective grid md:grid-cols-2 gap-3">
        {templates.map(t => (
          <TiltCard key={t.id} maxTilt={3} className="crm-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div><p className="text-xs text-muted mb-1">{t.category}</p><p className="font-medium">{t.name}</p></div>
              {t.status === "approved" ? <Badge tone="accent">Approved</Badge> : t.status === "rejected" ? <Badge tone="danger">Rejected</Badge> : <Badge tone="warning">Pending review</Badge>}
            </div>
            <div className="bg-bg border border-default rounded-lg p-3 mt-3">
              <p className="text-sm">{t.body}</p>
            </div>
            {t.status === "rejected" && <p className="text-xs text-danger mt-2 flex items-center gap-1"><AlertTriangle size={12} /> Rejected by provider — edit and resubmit.</p>}
          </TiltCard>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  /reports                                                           */
/* ------------------------------------------------------------------ */

function Reports({ campaigns, onMenuClick, menuOpen, dark }) {
  const data = campaigns.filter(c => c.sent > 0).map(c => ({ name: c.id, delivered: c.delivered, read: c.read, failed: c.failed }));
  return (
    <div>
      <PageHeader title="Reports" subtitle="Campaign performance and delivery outcomes." onMenuClick={onMenuClick} menuOpen={menuOpen} />
      <div className="crm-card p-6 mb-4">
        <p className="text-lg font-semibold mb-4">Delivered / read / failed by campaign</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid stroke={dark ? "#2C303A" : "#EEF0F3"} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: dark ? "#5B6270" : "#B0B7C3" }} axisLine={{ stroke: dark ? "#2C303A" : "#EEF0F3" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: dark ? "#5B6270" : "#B0B7C3" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${dark ? "#2C303A" : "#EEF0F3"}`, background: dark ? "#1B1E26" : "#FFFFFF", color: dark ? "#E7E9EE" : "#374151" }} />
            <Bar dataKey="delivered" fill="#5B8DEF" radius={[3, 3, 0, 0]} />
            <Bar dataKey="read" fill="#4ADE9A" radius={[3, 3, 0, 0]} />
            <Bar dataKey="failed" fill="#F0837D" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="crm-card overflow-x-auto crm-scrollbar">
        <table className="w-full text-sm min-w-[600px] border-collapse">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-default bg-surface-bright uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Campaign</th>
              <th className="px-4 py-3 font-medium">Recipients</th>
              <th className="px-4 py-3 font-medium">Delivery rate</th>
              <th className="px-4 py-3 font-medium">Read rate</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-default">
            {campaigns.map(c => (
              <tr key={c.id} className="hover:bg-surface-bright transition-colors">
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3 crm-mono text-xs">{c.recipients}</td>
                <td className="px-4 py-3 crm-mono text-xs">{c.sent ? Math.round((c.delivered / c.sent) * 100) : 0}%</td>
                <td className="px-4 py-3 crm-mono text-xs">{c.sent ? Math.round((c.read / c.sent) * 100) : 0}%</td>
                <td className="px-4 py-3"><CampaignStatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  /admin                                                             */
/* ------------------------------------------------------------------ */

function Admin({ users, onMenuClick, menuOpen }) {
  const [masked, setMasked] = useState(true);
  return (
    <div>
      <PageHeader title="Admin" subtitle="Users, WhatsApp account configuration, and access." onMenuClick={onMenuClick} menuOpen={menuOpen} />
      <div className="grid lg:grid-cols-2 gap-3 mb-4">
        <div className="crm-card p-5">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2"><ShieldCheck size={15} className="text-primary" /> WhatsApp account configuration</p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-default pb-2">
              <span className="text-muted">Provider</span><span className="text-xs">Not yet selected</span>
            </div>
            <div className="flex justify-between border-b border-default pb-2">
              <span className="text-muted">Business verification</span><Badge tone="warning">Pending client confirmation</Badge>
            </div>
            <div className="flex justify-between items-center border-b border-default pb-2">
              <span className="text-muted">API credentials</span>
              <span className="crm-mono text-xs flex items-center gap-2">
                {masked ? "••••••••••••3921" : "wh_live_9f2a...3921"}
                <button onClick={() => setMasked(m => !m)} className="text-muted-2 hover:text-ink"><Eye size={13} /></button>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Webhook endpoint</span><span className="crm-mono text-xs">/webhooks/whatsapp</span>
            </div>
          </div>
        </div>
        <div className="crm-card p-5">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Sparkles size={15} className="text-accent" /> Messaging policy checks</p>
          <ul className="space-y-2.5 text-sm">
            {["Consent required before bulk send", "Opt-outs auto-excluded from campaigns", "Only approved templates for first-contact sends", "Rate limiting enforced at worker layer"].map(t => (
              <li key={t} className="flex items-center gap-2"><Check size={14} className="text-accent shrink-0" /> {t}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="crm-card overflow-x-auto crm-scrollbar">
        <div className="flex items-center justify-between px-4 py-3 border-b border-default bg-surface-bright">
          <p className="text-sm font-semibold">Users</p>
          <button className="flex items-center gap-1.5 text-xs text-primary font-medium"><Plus size={13} /> Invite user</button>
        </div>
        <table className="w-full text-sm min-w-[540px] border-collapse">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-default bg-surface-bright uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-default">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-surface-bright transition-colors">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 text-muted">{u.role}</td>
                <td className="px-4 py-3 crm-mono text-xs">{u.email}</td>
                <td className="px-4 py-3">{u.status === "active" ? <Badge tone="accent">Active</Badge> : <Badge tone="warning">Invited</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  APP ROOT                                                           */
/* ------------------------------------------------------------------ */

export default function App() {
  const [user, setUser] = useState(null);
  const [active, setActive] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [contacts, setContacts] = useState(initialContacts);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [templates] = useState(initialTemplates);
  const [users] = useState(initialUsers);
  const [dark, setDark] = useState(false);
  const notify = (msg) => setToast(msg);

  if (!user) {
    return (
      <div className={`crm-root${dark ? " dark" : ""}`}>
        <Tokens />
        <LoginPage onLogin={setUser} />
      </div>
    );
  }

  const toggleMenu = () => setMobileOpen(o => !o);
  const pages = {
    dashboard: <Dashboard contacts={contacts} campaigns={campaigns} onMenuClick={toggleMenu} menuOpen={mobileOpen} dark={dark} />,
    contacts: <Contacts contacts={contacts} setContacts={setContacts} notify={notify} onMenuClick={toggleMenu} menuOpen={mobileOpen} />,
    campaigns: <Campaigns contacts={contacts} templates={templates} campaigns={campaigns} setCampaigns={setCampaigns} notify={notify} onMenuClick={toggleMenu} menuOpen={mobileOpen} />,
    templates: <Templates templates={templates} onMenuClick={toggleMenu} menuOpen={mobileOpen} />,
    reports: <Reports campaigns={campaigns} onMenuClick={toggleMenu} menuOpen={mobileOpen} dark={dark} />,
    admin: <Admin users={users} onMenuClick={toggleMenu} menuOpen={mobileOpen} />,
  };

  return (
    <div className={`crm-root min-h-screen flex${dark ? " dark" : ""}`}>
      <Tokens />
      <Sidebar active={active} setActive={setActive} user={user} onLogout={() => setUser(null)} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} dark={dark} setDark={setDark} />
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-7 lg:p-8">
          {pages[active]}
        </main>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
