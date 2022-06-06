export const isSpecialWallet = () => {
  return (window.ethereum as any)?.isSafePal || (window.ethereum as any)?.isAlphaWallet;
};
