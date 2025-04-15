module.exports = (input, censoredLength) => {
    if (!input || typeof input !== 'string') return input;
    if (input.length < 1) return input;
    return '*'.repeat(censoredLength) + input.slice(censoredLength - input.length);
}