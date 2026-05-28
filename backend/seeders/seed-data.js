/**
 * seed-data.js
 * Family-style groups (7-8 families) + 20+ investors spread across families.
 * AMC short codes derived from the MF Excel (Aditya Birla = ABSL, etc.)
 */

/* ── GROUPS (family names) ─────────────────────────────────── */
const SAMPLE_GROUPS = [
  { code: 'GRP-001', name: 'Jadhav Family',   description: 'Jadhav family portfolio group',   status: 'Active' },
  { code: 'GRP-002', name: 'Vagal Family',    description: 'Vagal family portfolio group',    status: 'Active' },
  { code: 'GRP-003', name: 'Sharma Family',   description: 'Sharma family portfolio group',   status: 'Active' },
  { code: 'GRP-004', name: 'Mehta Family',    description: 'Mehta family portfolio group',    status: 'Active' },
  { code: 'GRP-005', name: 'Patil Family',    description: 'Patil family portfolio group',    status: 'Active' },
  { code: 'GRP-006', name: 'Joshi Family',    description: 'Joshi family portfolio group',    status: 'Active' },
  { code: 'GRP-007', name: 'Kulkarni Family', description: 'Kulkarni family portfolio group', status: 'Active' },
  { code: 'GRP-008', name: 'Desai Family',    description: 'Desai family portfolio group',    status: 'Active' },
];

/* ── INVESTORS (20+ across the 8 families) ─────────────────── */
const SAMPLE_INVESTORS = [
  // Jadhav Family
  { name: 'Yash Jadhav',       email: 'yash.jadhav@gmail.com',       mobile: '9876543201', pan: 'ARJPJ1234A', address: 'Flat 301, Sai Heights, Pune 411001',    groupName: 'Jadhav Family' },
  { name: 'Suresh Jadhav',     email: 'suresh.jadhav@gmail.com',     mobile: '9876543202', pan: 'BSDPJ2345B', address: 'Flat 301, Sai Heights, Pune 411001',    groupName: 'Jadhav Family' },
  { name: 'Priya Jadhav',      email: 'priya.jadhav@gmail.com',      mobile: '9876543203', pan: 'CTEPJ3456C', address: 'Flat 301, Sai Heights, Pune 411001',    groupName: 'Jadhav Family' },

  // Vagal Family
  { name: 'Rajesh Vagal',      email: 'rajesh.vagal@gmail.com',      mobile: '9876543211', pan: 'DUFPV4567D', address: 'A-12, Vagad Nagar, Nashik 422001',      groupName: 'Vagal Family' },
  { name: 'Sunita Vagal',      email: 'sunita.vagal@gmail.com',      mobile: '9876543212', pan: 'EVGPV5678E', address: 'A-12, Vagad Nagar, Nashik 422001',      groupName: 'Vagal Family' },
  { name: 'Akash Vagal',       email: 'akash.vagal@gmail.com',       mobile: '9876543213', pan: 'FWHPV6789F', address: 'A-12, Vagad Nagar, Nashik 422001',      groupName: 'Vagal Family' },

  // Sharma Family
  { name: 'Amit Sharma',       email: 'amit.sharma@gmail.com',       mobile: '9876543221', pan: 'GXIPS7890G', address: '15, Rajpath Colony, Delhi 110001',      groupName: 'Sharma Family' },
  { name: 'Anita Sharma',      email: 'anita.sharma@gmail.com',      mobile: '9876543222', pan: 'HYJPS8901H', address: '15, Rajpath Colony, Delhi 110001',      groupName: 'Sharma Family' },
  { name: 'Rohan Sharma',      email: 'rohan.sharma@gmail.com',      mobile: '9876543223', pan: 'IZKPS9012I', address: '15, Rajpath Colony, Delhi 110001',      groupName: 'Sharma Family' },

  // Mehta Family
  { name: 'Vikram Mehta',      email: 'vikram.mehta@gmail.com',      mobile: '9876543231', pan: 'JALPM0123J', address: '202, Shreeji Towers, Ahmedabad 380001', groupName: 'Mehta Family' },
  { name: 'Kavita Mehta',      email: 'kavita.mehta@gmail.com',      mobile: '9876543232', pan: 'KBMPM1234K', address: '202, Shreeji Towers, Ahmedabad 380001', groupName: 'Mehta Family' },
  { name: 'Nikhil Mehta',      email: 'nikhil.mehta@gmail.com',      mobile: '9876543233', pan: 'LCNPM2345L', address: '202, Shreeji Towers, Ahmedabad 380001', groupName: 'Mehta Family' },

  // Patil Family
  { name: 'Mahesh Patil',      email: 'mahesh.patil@gmail.com',      mobile: '9876543241', pan: 'MDOPP3456M', address: '7, Ganesh Chowk, Kolhapur 416001',      groupName: 'Patil Family' },
  { name: 'Rekha Patil',       email: 'rekha.patil@gmail.com',       mobile: '9876543242', pan: 'NEPPQ4567N', address: '7, Ganesh Chowk, Kolhapur 416001',      groupName: 'Patil Family' },
  { name: 'Saurabh Patil',     email: 'saurabh.patil@gmail.com',     mobile: '9876543243', pan: 'OFQPR5678O', address: '7, Ganesh Chowk, Kolhapur 416001',      groupName: 'Patil Family' },

  // Joshi Family
  { name: 'Dinesh Joshi',      email: 'dinesh.joshi@gmail.com',      mobile: '9876543251', pan: 'PGRPJ6789P', address: 'Plot 5, Shivaji Nagar, Nagpur 440001',  groupName: 'Joshi Family' },
  { name: 'Asha Joshi',        email: 'asha.joshi@gmail.com',        mobile: '9876543252', pan: 'QHSPJ7890Q', address: 'Plot 5, Shivaji Nagar, Nagpur 440001',  groupName: 'Joshi Family' },

  // Kulkarni Family
  { name: 'Prakash Kulkarni',  email: 'prakash.kulkarni@gmail.com',  mobile: '9876543261', pan: 'RITPK8901R', address: 'B-7, MG Road, Mumbai 400001',          groupName: 'Kulkarni Family' },
  { name: 'Sushma Kulkarni',   email: 'sushma.kulkarni@gmail.com',   mobile: '9876543262', pan: 'SJUPK9012S', address: 'B-7, MG Road, Mumbai 400001',          groupName: 'Kulkarni Family' },
  { name: 'Kiran Kulkarni',    email: 'kiran.kulkarni@gmail.com',    mobile: '9876543263', pan: 'TKVPK0123T', address: 'B-7, MG Road, Mumbai 400001',          groupName: 'Kulkarni Family' },

  // Desai Family
  { name: 'Hemant Desai',      email: 'hemant.desai@gmail.com',      mobile: '9876543271', pan: 'ULWPD1234U', address: '12, Laxmi Road, Surat 395001',         groupName: 'Desai Family' },
  { name: 'Ranjana Desai',     email: 'ranjana.desai@gmail.com',     mobile: '9876543272', pan: 'VMXPD2345V', address: '12, Laxmi Road, Surat 395001',         groupName: 'Desai Family' },
];

module.exports = { SAMPLE_GROUPS, SAMPLE_INVESTORS };