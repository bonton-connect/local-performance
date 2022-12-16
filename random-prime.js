"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomPrime = exports.eachPrime = exports.isPrime = void 0;
var isPrime = function (number) {
    if (!Number.isInteger(number))
        return false;
    if (number < 2)
        return false;
    if (number === 2 || number === 3)
        return true;
    if (number % 2 === 0 || number % 3 === 0)
        return false;
    var maxDivisor = Math.floor(Math.sqrt(number));
    for (var i = 5; i <= maxDivisor; i += 6) {
        if (number % i === 0 || number % (i + 2) === 0)
            return false;
    }
    return true;
};
exports.isPrime = isPrime;
var eachPrime = function (list) {
    if (!Array.isArray(list) || list.length === 0)
        return false;
    return list.every(function (number) { return (0, exports.isPrime)(number); });
};
exports.eachPrime = eachPrime;
var randomPrime = function (_a) {
    var _b = _a.min, min = _b === void 0 ? 0 : _b, _c = _a.max, max = _c === void 0 ? Number.MAX_SAFE_INTEGER : _c;
    if (!Number.isInteger(min) || !Number.isInteger(max) || min > max)
        return null;
    var range = max - min + 1;
    var randomNumber = Math.floor(Math.random() * range) + min;
    if ((0, exports.isPrime)(randomNumber))
        return randomNumber;
    var i = randomNumber - 1;
    var j = randomNumber + 1;
    while (i >= min && j <= max) {
        if ((0, exports.isPrime)(i))
            return i;
        if ((0, exports.isPrime)(j))
            return j;
        i -= 1;
        j += 1;
    }
    while (i >= min) {
        if ((0, exports.isPrime)(i))
            return i;
        i -= 1;
    }
    while (j <= max) {
        if ((0, exports.isPrime)(j))
            return j;
        j += 1;
    }
    return null;
};
exports.randomPrime = randomPrime;
