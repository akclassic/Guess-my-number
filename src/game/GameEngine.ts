// Check if the value is a 4-digit string with all unique digits
export function isValidNumber(value: string): boolean {
    if(value.length !== 4) return false;
    const digits = new Set(value.split(''));
    return digits.size === 4;
}

export function computeBullsAndCows(secret: string, guess: string) {
    let bulls = 0;
    let cows = 0;

    for (let i = 0; i  < 4; i++) {
        if (guess[i] === secret[i]) {
            bulls++;
        } else if (secret.includes(guess[i] as string)) {
            cows++;
        }
    }

    return { bulls, cows };
}