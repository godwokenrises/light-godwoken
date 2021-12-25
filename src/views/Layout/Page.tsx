import React from "react";
export const DEFAULT_META = {
  title: "YokaiSwap",
  description: "A next evolution DeFi exchange on Nervos Network.",
  image: "https://www.yokaiswap.com/images/hero.png",
};
interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
  symbol?: string;
}

const Page: React.FC<PageProps> = ({ children }) => {
  return (
    <>
      <div>{children}</div>
    </>
  );
};

export default Page;
