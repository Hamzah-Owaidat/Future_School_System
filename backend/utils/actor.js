'use strict';

/** Employee id used for created_by / updated_by (staff actions only). */
function getActorEmployeeId(req) {
  return req.employee?.id ?? null;
}

function isStudentAccount(req) {
  return req.auth?.type === 'student';
}

function isEmployeeAccount(req) {
  return req.auth?.type === 'employee';
}

module.exports = {
  getActorEmployeeId,
  isStudentAccount,
  isEmployeeAccount
};
