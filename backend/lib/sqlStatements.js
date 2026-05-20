'use strict';

/**
 * Split SQL into statements — respects ', ", ` and skips -- / slash-star comments.
 */
function splitSqlStatements(rawSql) {
  const statements = [];
  let buf = '';
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;

  for (let i = 0; i < rawSql.length; i++) {
    const c = rawSql[i];
    const next = rawSql[i + 1];

    if (!inSingle && !inDouble && !inBacktick && c === '-' && next === '-') {
      i += 1;
      while (i + 1 < rawSql.length && rawSql[i + 1] !== '\n') {
        i++;
      }
      continue;
    }

    if (!inSingle && !inDouble && !inBacktick && c === '/' && next === '*') {
      i += 2;
      while (i + 1 < rawSql.length && !(rawSql[i] === '*' && rawSql[i + 1] === '/')) {
        i++;
      }
      i += 1;
      continue;
    }

    if (c === "'" && !inDouble && !inBacktick) {
      inSingle = !inSingle;
      buf += c;
      continue;
    }
    if (c === '"' && !inSingle && !inBacktick) {
      inDouble = !inDouble;
      buf += c;
      continue;
    }
    if (c === '`' && !inSingle && !inDouble) {
      inBacktick = !inBacktick;
      buf += c;
      continue;
    }

    if (c === ';' && !inSingle && !inDouble && !inBacktick) {
      const trimmed = buf.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      buf = '';
      continue;
    }

    buf += c;
  }

  const last = buf.trim();
  if (last.length > 0) statements.push(last);
  return statements;
}

const IGNORABLE_ERRNOS = new Set([
  1050, // ER_TABLE_EXISTS_ERROR
  1060, // ER_DUP_FIELDNAME
  1061 // ER_DUP_KEYNAME
]);

function shouldIgnoreMysqlError(errno, sql) {
  const n = Number(errno);
  if (!Number.isFinite(n)) return false;
  if (IGNORABLE_ERRNOS.has(n)) return true;
  if (n === 1091) return true;
  if (n === 1826) return true;
  if (n === 1062 && /\/\*\s*MIGRATION_IGNORE_DUP_ROW\s*\*\//i.test(sql)) {
    return true;
  }
  return false;
}

module.exports = {
  splitSqlStatements,
  shouldIgnoreMysqlError
};
