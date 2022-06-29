import { getEstimateWaitTime } from "../dateUtils";
describe("test date utils", () => {
  it("should return expected wait time", async () => {
    const waitTime0 = getEstimateWaitTime(100, 30 * 1000);
    const waitTime1 = getEstimateWaitTime(10000, 45 * 1000);
    const waitTime2 = getEstimateWaitTime(16800, 36 * 1000);

    expect(waitTime0).toEqual("50 minutes");
    expect(waitTime1).toEqual("5 days");
    expect(waitTime2).toEqual("7 days");
  });
});
