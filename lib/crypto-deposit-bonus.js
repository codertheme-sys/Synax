/**
 * Crypto deposit welcome / tier bonuses (USDT-denominated value at approval time).
 * — Deposits valued at ≥ HIGH_TIER_USDT get HIGH_RATE.
 * — Otherwise, the user's first completed crypto deposit gets FIRST_RATE.
 * Applied at approval by crediting deposit × (1 + rate) in the same asset (balance or portfolio).
 */

export const CRYPTO_DEPOSIT_BONUS_HIGH_TIER_USDT = 3000;
export const CRYPTO_DEPOSIT_BONUS_HIGH_RATE = 0.15;
export const CRYPTO_DEPOSIT_BONUS_FIRST_RATE = 0.1;

/**
 * @param {number} totalValueUsdt - Deposit value in USDT
 * @param {boolean} isFirstCompletedCryptoDeposit - No prior completed crypto deposits for this user
 * @returns {{ rate: number, bonusUsdt: number, reason: 'high_tier' | 'first_crypto' | 'none' }}
 */
export function computeCryptoDepositBonus(totalValueUsdt, isFirstCompletedCryptoDeposit) {
  const v = Number(totalValueUsdt);
  if (!Number.isFinite(v) || v <= 0) {
    return { rate: 0, bonusUsdt: 0, reason: 'none' };
  }
  if (v >= CRYPTO_DEPOSIT_BONUS_HIGH_TIER_USDT) {
    const bonusUsdt = roundUsdt(v * CRYPTO_DEPOSIT_BONUS_HIGH_RATE);
    return { rate: CRYPTO_DEPOSIT_BONUS_HIGH_RATE, bonusUsdt, reason: 'high_tier' };
  }
  if (isFirstCompletedCryptoDeposit) {
    const bonusUsdt = roundUsdt(v * CRYPTO_DEPOSIT_BONUS_FIRST_RATE);
    return { rate: CRYPTO_DEPOSIT_BONUS_FIRST_RATE, bonusUsdt, reason: 'first_crypto' };
  }
  return { rate: 0, bonusUsdt: 0, reason: 'none' };
}

function roundUsdt(n) {
  return Math.round(Number(n) * 100) / 100;
}
