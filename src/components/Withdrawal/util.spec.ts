import { getInputError, isCKBInputValidate, isSudtInputValidate } from "./utils";

describe("Withdrawal/util", () => {
  describe("isSudtInputValidate", () => {
    it("sudt value should not be empty string", () => {
      expect(isSudtInputValidate("", "400", 8)).toEqual(false);
    });

    it("sudt balance should not be undefined", () => {
      expect(isSudtInputValidate("400", undefined, 8)).toEqual(false);
    });
    it("sudt value should equal or less than sudt balance", () => {
      expect(isSudtInputValidate("500", "40000000000", 8)).toEqual(false);
      expect(isSudtInputValidate("300", "40000000000", 8)).toEqual(true);
      expect(isSudtInputValidate("400", "40000000000", 8)).toEqual(true);
    });

    it("should return false if sudt value is 0", () => {
      expect(isSudtInputValidate("0", "40000000000", 8)).toEqual(false);
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
