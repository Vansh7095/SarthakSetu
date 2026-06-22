import { db, fssaiLicensesTable, darpanIdsTable, adminCodesTable } from "./index";

async function seedVerifications() {
  await db.insert(fssaiLicensesTable).values([
    { licenseNumber: "10014012000086", businessName: "Sharma Ji Dhaba", city: "Delhi", state: "Delhi", category: "Restaurant" },
    { licenseNumber: "10719016002037", businessName: "Mumbai Grand Hotel", city: "Mumbai", state: "Maharashtra", category: "Hotel" },
    { licenseNumber: "21220001000062", businessName: "Priya Caterers", city: "Hyderabad", state: "Telangana", category: "Caterer" },
    { licenseNumber: "11517008000543", businessName: "Bengaluru Biryani House", city: "Bengaluru", state: "Karnataka", category: "Restaurant" },
    { licenseNumber: "10014025000124", businessName: "The Lalit New Delhi", city: "Delhi", state: "Delhi", category: "Hotel" },
    { licenseNumber: "21223014003891", businessName: "Royal Events & Catering", city: "Chennai", state: "Tamil Nadu", category: "Event Organizer" },
    { licenseNumber: "11219011002267", businessName: "Kolkata Grand Kitchen", city: "Kolkata", state: "West Bengal", category: "Restaurant" },
    { licenseNumber: "10919006001188", businessName: "Jaipur Heritage Caterers", city: "Jaipur", state: "Rajasthan", category: "Caterer" },
    { licenseNumber: "21315004001729", businessName: "Ahmedabad Sweets Palace", city: "Ahmedabad", state: "Gujarat", category: "Restaurant" },
    { licenseNumber: "12116001002556", businessName: "Pune Garden Catering", city: "Pune", state: "Maharashtra", category: "Caterer" },
  ]).onConflictDoNothing();

  await db.insert(darpanIdsTable).values([
    { darpanId: "MH/2010/0012345", orgName: "Feeding India Foundation", city: "Mumbai", state: "Maharashtra" },
    { darpanId: "DL/2008/0023456", orgName: "Robin Hood Army Delhi", city: "Delhi", state: "Delhi" },
    { darpanId: "KA/2015/0034567", orgName: "Akshaya Patra Bengaluru", city: "Bengaluru", state: "Karnataka" },
    { darpanId: "TN/2012/0045678", orgName: "No Hungry India Trust", city: "Chennai", state: "Tamil Nadu" },
    { darpanId: "WB/2009/0056789", orgName: "Kolkata Food Bank Society", city: "Kolkata", state: "West Bengal" },
    { darpanId: "TS/2018/0067890", orgName: "Hyderabad Food Connect NGO", city: "Hyderabad", state: "Telangana" },
    { darpanId: "RJ/2014/0078901", orgName: "Jaipur Community Kitchen", city: "Jaipur", state: "Rajasthan" },
    { darpanId: "GJ/2011/0089012", orgName: "Ahmedabad Hunger Relief", city: "Ahmedabad", state: "Gujarat" },
    { darpanId: "MH/2016/0090123", orgName: "Pune Meal Mission", city: "Pune", state: "Maharashtra" },
    { darpanId: "UP/2013/0101234", orgName: "Lucknow Food Seva Trust", city: "Lucknow", state: "Uttar Pradesh" },
  ]).onConflictDoNothing();

  await db.insert(adminCodesTable).values([
    { code: "ANNSETU_ADMIN_2024", label: "Default Admin Code 2024" },
    { code: "PLATFORM_ADMIN_KEY", label: "Operations Team Code" },
    { code: "ANNSETU_SUPERADMIN", label: "Super Admin Code" },
  ]).onConflictDoNothing();

  console.log("✅ Verification tables seeded");
  process.exit(0);
}

seedVerifications().catch((e) => { console.error(e); process.exit(1); });
