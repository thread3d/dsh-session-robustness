# Static Analysis Issues

## Summary
7 findings identified by CodeWitness static analysis:
- **HIGH**: 1
- **MEDIUM**: 4
- **LOW**: 2

---

## HIGH Severity Issues

### H001: Test Process Exit Issue
**File:** `test/smoke-static.mjs`  
**Line:** 406  
**Category:** BUG  
**Rule:** CW-JS-BUG-002  
**Message:** Exiting the process abandons in-flight work and makes the code untestable; return a result instead.

**Current Code:**
```javascript
console.log(failures === 0 ? '\nsmoke: ALL GREEN' : `\nsmoke: ${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
```

**Impact:**
- Makes test untestable via programmatic means
- Abandons in-flight work when test fails
- Prevents proper test result aggregation

**Recommended Fix:**
```javascript
console.log(failures === 0 ? '\nsmoke: ALL GREEN' : `\nsmoke: ${failures} FAILED`);

// Return result instead of process.exit()
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { success: failures === 0, failures };
}

// Keep process.exit for direct execution
if (require.main === module) {
  process.exit(failures === 0 ? 0 : 1);
}
```

**Resolution Status:** Open

---

## MEDIUM Severity Issues

All MEDIUM severity issues are related to loose equality comparisons in `lib/index.js`.

### M001: Loose Equality at Line 183
**File:** `lib/index.js`  
**Line:** 183  
**Category:** CORRECTNESS  
**Rule:** CW-JS-REL-001  
**Message:** Loose equality coerces its operands, so '0' == false and '' == 0. Use === or !==.

**Context:**
Line 183 is in the `isNeverRetryCode` or related validation function.

**Impact:**
Loose equality can cause unexpected behavior:
- `'0' == false` → `true`
- `'' == 0` → `true`
- `'5' == 5` → `true`

**Recommended Fix:**
Replace `==` with `===` and `!=` with `!==` in that comparison.

**Resolution Status:** Open

### M002: Loose Equality at Line 237
**File:** `lib/index.js`  
**Line:** 237  
**Category:** CORRECTNESS  
**Rule:** CW-JS-REL-001

**Context:**
Line 237 is in the `isCatchallCode` function checking string comparisons.

**Recommended Fix:**
Replace loose equality with strict equality (`===` or `!==`).

**Resolution Status:** Open

### M003: Loose Equality at Line 247
**File:** `lib/index.js`  
**Line:** 247  
**Category:** CORRECTNESS  
**Rule:** CW-JS-REL-001

**Context:**
Line 247 is in the `isRetryableFailure` function.

**Recommended Fix:**
Replace loose equality with strict equality (`===` or `!==`).

**Resolution Status:** Open

### M004: Loose Equality at Line 496
**File:** `lib/index.js`  
**Line:** 496  
**Category:** CORRECTNESS  
**Rule:** CW-JS-REL-001

**Context:**
Line 496 is in the recovery function handling retry logic.

**Recommended Fix:**
Replace loose equality with strict equality (`===` or `!==`).

**Resolution Status:** Open

---

## LOW Severity Issues

Both LOW severity issues are in `lib/client.js` regarding the use of `var` instead of `let` or `const`.

### L001: Function-Scoped Var at Line 4
**File:** `lib/client.js`  
**Line:** 4  
**Category:** MAINTAINABILITY  
**Rule:** CW-JS-REL-004  
**Message:** `var` is function scoped and hoisted, so it leaks out of blocks and reads as undefined before its assignment. Use let or const.

**Current Code:**
```javascript
var module = { exports: {} };
```

**Impact:**
- Function scoping instead of block scoping
- Hoisting can cause unexpected undefined values
- Harder to reason about variable lifetime

**Recommended Fix:**
```javascript
const module = { exports: {} };
```

**Resolution Status:** Open

### L002: Function-Scoped Var at Line 5
**File:** `lib/client.js`  
**Line:** 5  
**Category:** MAINTAINABILITY  
**Rule:** CW-JS-REL-004

**Current Code:**
```javascript
var exports = module.exports;
```

**Recommended Fix:**
```javascript
const exports = module.exports;
```

**Resolution Status:** Open

---

## Notes

1. **Security Analysis:** No security vulnerabilities were found
2. **Dependencies:** All 3 dependencies inventory scanned
3. **Test Framework:** node:test detected but test execution not performed

These issues should be addressed in a future release to improve code quality and correctness.
