import { postNewsletterUnsubscribe } from "@shopware-pwa/shopware-6-client";
import { defaultInstance } from "../../../src/apiService";

jest.mock("../../../src/apiService");
const mockedApiInstance = defaultInstance as jest.Mocked<
  typeof defaultInstance
>;

describe("FormService - postNewsletterUnsubscribe", () => {
  const mockedPost = jest.fn();
  beforeEach(() => {
    jest.resetAllMocks();
    mockedApiInstance.invoke = {
      post: mockedPost,
    } as any;
  });
  it("should invoke correct API endpoint with given parameters", async () => {
    await postNewsletterUnsubscribe({ email: "john@doe.com" });
    expect(mockedPost).toBeCalledTimes(1);
    expect(mockedPost).toBeCalledWith(
      "/store-api/v3/newsletter/unsubscribe",
      "john@doe.com"
    );
  });

  it("should throw an error when data is incorrect", async () => {
    mockedPost.mockRejectedValueOnce(new Error("500"));
    expect(postNewsletterUnsubscribe({ email: "" })).rejects.toThrowError(
      "500"
    );
    expect(mockedPost).toBeCalledWith(
      "/store-api/v3/newsletter/unsubscribe",
      ""
    );
  });
});
