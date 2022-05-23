import { BI } from "@ckb-lumos/bi";
import { notification } from "antd";
import { NotEnoughCapacityError, NotEnoughSudtError } from "../../light-godwoken/constants/error";
import { L1MappedErc20 } from "../../types/type";
import { getFullDisplayAmount } from "../../utils/formatTokenAmount";
import { formatToThousands } from "../../utils/numberFormat";

export const handleError = (e: unknown, selectedSudt?: L1MappedErc20) => {
  if (e instanceof NotEnoughCapacityError) {
    const expect = formatToThousands(getFullDisplayAmount(BI.from(e.metadata.expected), 8, { maxDecimalPlace: 8 }));
    const actual = formatToThousands(getFullDisplayAmount(BI.from(e.metadata.actual), 8, { maxDecimalPlace: 8 }));
    notification.error({
      message: `You need to get more ckb for withdraw, cause there is ${expect} CKB expected but only got ${actual} CKB`,
    });
    return;
  }
  if (e instanceof NotEnoughSudtError) {
    const expect = formatToThousands(
      getFullDisplayAmount(BI.from(e.metadata.expected), selectedSudt?.decimals, {
        maxDecimalPlace: selectedSudt?.decimals,
      }),
    );
    const actual = formatToThousands(
      getFullDisplayAmount(BI.from(e.metadata.actual), selectedSudt?.decimals, {
        maxDecimalPlace: selectedSudt?.decimals,
      }),
    );
    notification.error({
      message: `You need to get more ${selectedSudt?.symbol} for withdraw, cause there is ${expect} ${selectedSudt?.symbol} expected but only got ${actual} ${selectedSudt?.symbol}`,
    });
    return;
  }
  console.error(e);
  notification.error({
    message: `Server Error, Please try again later`,
  });
};
