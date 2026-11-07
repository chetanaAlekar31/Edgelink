import { MissingConfigurationError } from "@/server/errors";

export type EmailDelivery = {
  status: "not_available";
};

export async function deliverEmail(clientEmail: string | null | undefined): Promise<EmailDelivery> {
  if (process.env.USE_MOCKS === "true") {
    console.log("[email] Not available");
    console.log("[email] Recipient:", clientEmail ?? "Not available");
    return { status: "not_available" };
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) {
    throw new MissingConfigurationError("Email delivery is not configured.");
  }
  throw new MissingConfigurationError("Email delivery is not configured for live calls.");
}
