const fs = require('fs');

const actionsPath = './src/lib/actions.ts';
let actionsCode = fs.readFileSync(actionsPath, 'utf8');

actionsCode = actionsCode.replace(/throw new Error\((.*?)\);/g, 'return { error: $1 };');
fs.writeFileSync(actionsPath, actionsCode);

const adminPath = './src/app/admin/page.tsx';
let adminCode = fs.readFileSync(adminPath, 'utf8');

// We need to capture the variable assignment or just the await call.
// Example: await callNextQueue(scheduleId); -> const res = await callNextQueue(scheduleId); if (res?.error) throw new Error(res.error);
const actionNames = [
  'callNextQueue', 'recallQueue', 'finishCurrentQueue', 'callSpecificQueue',
  'addDoctor', 'updateDoctor', 'deleteSchedule', 'updateSetting', 'toggleAttendance',
  'takeQueue', 'cancelQueue', 'addPatient', 'deletePatient'
];

actionNames.forEach(action => {
  const regex = new RegExp(`await ${action}\\(`, 'g');
  adminCode = adminCode.replace(regex, `await (async (...args) => { const r = await ${action}(...args); if (r?.error) throw new Error(r.error); return r; })(`);
});
fs.writeFileSync(adminPath, adminCode);

const patientPath = './src/app/patient/page.tsx';
let patientCode = fs.readFileSync(patientPath, 'utf8');
actionNames.forEach(action => {
  const regex = new RegExp(`await ${action}\\(`, 'g');
  patientCode = patientCode.replace(regex, `await (async (...args) => { const r = await ${action}(...args); if (r?.error) throw new Error(r.error); return r; })(`);
});
fs.writeFileSync(patientPath, patientCode);

console.log("Updated files to handle Server Action errors gracefully.");
