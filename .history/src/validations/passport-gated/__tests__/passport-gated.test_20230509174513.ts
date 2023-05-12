import Validation from "../index";

describe("getSigningMessage", () => {
  it("should return a valid signing message and nonce", async () => {
    const validation = new Validation();
    const response = await validation.getSigningMessage();
    expect(response).toHaveProperty("message");
    expect(response).toHaveProperty("nonce");
  });
});
