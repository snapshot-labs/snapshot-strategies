import Validation from "../index";
import 

describe("getSigningMessage", () => {
  it("should return a valid signing message and nonce", async () => {
    const validation = new Validation();
    const response = await validation.getSigningMessage();
    expect(response).toHaveProperty("message");
    expect(response).toHaveProperty("nonce");
  });
});

describe("submitPassport", () => {
    it("should submit a passport successfully", async () => {
      const validation = new Validation();
      validation.author = "0x24F15402C6Bb870554489b2fd2049A85d75B982f"; // Example author
      await validation.submitPassport(); // Add appropriate checks or logs to see the response
    });
  });
