const fs = require('fs');

const adminPath = './src/app/admin/page.tsx';
let adminCode = fs.readFileSync(adminPath, 'utf8');
adminCode = adminCode.replace(/if \(r\?\.error\) throw new Error\(r\.error\);/g, 'if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error);');
fs.writeFileSync(adminPath, adminCode);

const patientPath = './src/app/patient/page.tsx';
let patientCode = fs.readFileSync(patientPath, 'utf8');
patientCode = patientCode.replace(/if \(r\?\.error\) throw new Error\(r\.error\);/g, 'if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error);');
fs.writeFileSync(patientPath, patientCode);

console.log("TypeScript errors fixed.");
