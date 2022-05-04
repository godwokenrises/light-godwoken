import {
  getDepositInputError,
  getInputError,
  isCKBInputValidate,
  isDepositCKBInputValidate,
  isSudtInputValidate,
} from "./inputValidate";

describe("Withdrawal/util", () => {
  describe("isSudtInputValidate", () => {
    it("sudt value can be empty string", () => {
      expect(isSudtInputValidate("", "400", 8)).toEqual(true);
    });

    it("sudt balance should not be undefined", () => {
      expect(isSudtInputValidate("400", undefined, 8)).toEqual(false);
    });
    it("sudt value should equal or less than sudt balance", () => {
      expect(isSudtInputValidate("500", "40000000000", 8)).toEqual(false);
      expect(isSudtInputValidate("300", "40000000000", 8)).toEqual(true);
      expect(isSudtInputValidate("400", "40000000000", 8)).toEqual(true);
    });

    it("sudt value can be 0", () => {
      expect(isSudtInputValidate("0", "40000000000", 8)).toEqual(true);
    });
  });

  describe("isCKBInputValidate", () => {
    it("ckb value can not be empty string", () => {
      expect(isCKBInputValidate("", "400")).toEqual(false);
    });

    it("ckb balance can not be undefined", () => {
      expect(isCKBInputValidate("400", undefined)).toEqual(false);
    });
    it("ckb input must equal or great than 400", () => {
      expect(isCKBInputValidate("400", "50000000000")).toEqual(true);
      expect(isCKBInputValidate("401", "50000000000")).toEqual(true);
      expect(isCKBInputValidate("399", "50000000000")).toEqual(false);
    });

    it("ckb value is equal or less than ckb balance", () => {
      expect(isCKBInputValidate("500", "50000000000")).toEqual(true);
      expect(isCKBInputValidate("400", "50000000000")).toEqual(true);
      expect(isCKBInputValidate("501", "50000000000")).toEqual(false);
    });

    it("ckb value can not be 0", () => {
      expect(isCKBInputValidate("0", "40000000000")).toEqual(false);
    });
  });

  describe("getInputError", () => {
    it("should return 'Enter CKB Amount' if ckb value is empty string", () => {
      expect(getInputError("", "40000000000", "", "", 0, "SUDT")).toEqual("Enter CKB Amount");
    });

    it("should return 'Insufficient CKB Amount' if ckb value is great than ckb balance", () => {
      expect(getInputError("401", "40000000000", "", "", 0, "SUDT")).toEqual("Insufficient CKB Amount");
    });

    it("should return 'Minimum 400 CKB' if ckb value is less than 400", () => {
      expect(getInputError("399", "40000000000", "", "", 0, "SUDT")).toEqual("Minimum 400 CKB");
    });

    it("should return 'Insufficient SUDT Amount' if sudt value is great than sudt balance", () => {
      expect(getInputError("400", "40000000000", "101", "10000", 2, "SUDT")).toEqual("Insufficient SUDT Amount");
    });
  });
});

describe("isDepositCKBInputValidate", () => {
  it("ckb value can not be empty string", () => {
    expect(isDepositCKBInputValidate("", "400")).toEqual(false);
  });

  it("ckb balance can not be undefined", () => {
    expect(isDepositCKBInputValidate("400", undefined)).toEqual(false);
  });
  it("ckb input must equal or great than 400", () => {
    expect(isDepositCKBInputValidate("400", "50000000000")).toEqual(true);
    expect(isDepositCKBInputValidate("401", "50000000000")).toEqual(true);
    expect(isDepositCKBInputValidate("399", "50000000000")).toEqual(false);
  });

  it("ckb value is equal or less than ckb balance", () => {
    expect(isDepositCKBInputValidate("500", "50000000000")).toEqual(true);
    expect(isDepositCKBInputValidate("400", "50000000000")).toEqual(true);
    expect(isDepositCKBInputValidate("501", "50000000000")).toEqual(false);
  });

  it("ckb value can not be 0", () => {
    expect(isDepositCKBInputValidate("0", "40000000000")).toEqual(false);
  });

  it("should deposit all or left at least 64 ckb", () => {
    expect(isDepositCKBInputValidate("500", "50000000000")).toEqual(true);
    expect(isDepositCKBInputValidate("436", "50000000000")).toEqual(true);
    expect(isDepositCKBInputValidate("437", "50000000000")).toEqual(false);
  });
});

describe("getDepositInputError", () => {
  it("should return 'Enter CKB Amount' if ckb value is empty string", () => {
    expect(getDepositInputError("", "40000000000", "", "", 0, "SUDT")).toEqual("Enter CKB Amount");
  });

  it("should return 'Insufficient CKB Amount' if ckb value is great than ckb balance", () => {
    expect(getDepositInputError("401", "40000000000", "", "", 0, "SUDT")).toEqual("Insufficient CKB Amount");
  });

  it("should return 'Minimum 400 CKB' if ckb value is less than 400", () => {
    expect(getDepositInputError("399", "40000000000", "", "", 0, "SUDT")).toEqual("Minimum 400 CKB");
  });

  it("should return 'Insufficient SUDT Amount' if sudt value is great than sudt balance", () => {
    expect(getDepositInputError("400", "40000000000", "101", "10000", 2, "SUDT")).toEqual("Insufficient SUDT Amount");
  });

  it("should return 'Must Left 0 Or 64 More CKB' if 0 < (ckb balance - ckb input) < 64", () => {
    expect(getDepositInputError("437", "50000000000", "", "", 0, "SUDT")).toEqual("Must Left 0 Or 64 More CKB");
    expect(getDepositInputError("500", "50000000000", "", "", 0, "SUDT")).toEqual(undefined);
    expect(getDepositInputError("436", "50000000000", "", "", 0, "SUDT")).toEqual(undefined);
  });
});
