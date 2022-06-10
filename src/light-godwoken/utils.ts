export const isSpecialWallet = () => {
  return window && ((window.ethereum as any)?.isSafePal || (window.ethereum as any)?.isAlphaWallet);
};
