import Validation from "../index";
import snapshot from '@snapshot-labs/snapshot.js';
import examples from '../examples.json';

const validation = new snapshot.validations[id].validation(
    example.author,
    example.space,
    example.network,
    example.snapshot,
    example.params
  );
  
const example = examples[0];

const validation = new Validation(
    example.author,
    example.space,
    example.network,
    example.snapshot,
    example.params
  );

  describe("getSigningMessage", () => {
    it("should return a valid signing message and nonce", async () => {
      const response = await validation.getSigningMessage();
      expect(response).toHaveProperty("message");
      expect(response).toHaveProperty("nonce");
    });
  });
  
  describe("submitPassport", () => {
    it("should submit a passport successfully", async () => {
      validation.author = "0x24F15402C6Bb870554489b2fd2049A85d75B982f"; // Example author
      await validation.submitPassport(); // Add appropriate checks or logs to see the response
    });
  });
  
