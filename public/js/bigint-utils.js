function addStrings(a, b) {
    let carry = 0;
    let result = '';
    a = a.toString().split('').reverse();
    b = b.toString().split('').reverse();
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
        const digitA = parseInt(a[i] || '0', 10);
        const digitB = parseInt(b[i] || '0', 10);
        const sum = digitA + digitB + carry;
        result = (sum % 10) + result;
        carry = Math.floor(sum / 10);
    }
    if (carry) result = carry + result;
    return result;
}

function subtractStrings(a, b) {
    let borrow = 0;
    let result = '';
    a = a.toString().split('').reverse();
    b = b.toString().split('').reverse();
    for (let i = 0; i < a.length; i++) {
        let digitA = parseInt(a[i], 10) - borrow;
        const digitB = parseInt(b[i] || '0', 10);
        if (digitA < digitB) {
            digitA += 10;
            borrow = 1;
        } else {
            borrow = 0;
        }
        const diff = digitA - digitB;
        result = diff + result;
    }
    result = result.replace(/^0+/, '');
    return result || '0';
}

function accountIdToSteamId64(accountId) {
    if (!accountId) return null;
    try {
        if (typeof BigInt !== 'undefined') {
            return (BigInt(accountId) + 76561197960265728n).toString();
        }
    } catch (e) {
        console.warn('BigInt conversion failed:', e);
    }
    return addStrings(accountId.toString(), '76561197960265728');
}

function steamId64ToAccountId(steamId64) {
    if (!steamId64) return null;
    try {
        if (typeof BigInt !== 'undefined') {
            return (BigInt(steamId64) - 76561197960265728n).toString();
        }
    } catch (e) {
        console.warn('BigInt conversion failed:', e);
    }
    return subtractStrings(steamId64.toString(), '76561197960265728');
}

// Make functions globally available
window.addStrings = addStrings;
window.subtractStrings = subtractStrings;
window.accountIdToSteamId64 = accountIdToSteamId64;
window.steamId64ToAccountId = steamId64ToAccountId;
