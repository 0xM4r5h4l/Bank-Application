function censorString(input, censoredLength) {
    return '*'.repeat(censoredLength) + input.slice(censoredLength - input.length);
}

module.exports = censorString;
