import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { CandidateFixture } from "../sports/types";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompt";
import { AiTipsSchema, type AiTips } from "./schema";

export interface TipGenerator {
  generate(date: string, candidates: CandidateFixture[], feedback?: string): Promise<AiTips>;
}

export class ClaudeTipGenerator implements TipGenerator {
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new Anthropic({ apiKey });
  }

  async generate(date: string, candidates: CandidateFixture[], feedback?: string): Promise<AiTips> {
    const response = await this.client.messages.parse({
      model: this.model,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(date, candidates, feedback) }],
      output_config: { format: zodOutputFormat(AiTipsSchema) },
    });

    if (response.stop_reason === "refusal") {
      throw new Error(`Model AI odmówił odpowiedzi (${response.stop_details?.category ?? "brak kategorii"}).`);
    }
    if (response.stop_reason === "max_tokens") {
      throw new Error("Odpowiedź AI została ucięta (max_tokens).");
    }
    if (!response.parsed_output) {
      throw new Error("Nie udało się odczytać odpowiedzi AI.");
    }
    return response.parsed_output;
  }
}
