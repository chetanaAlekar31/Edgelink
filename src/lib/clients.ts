import { z } from "zod";

export const clientAuditStatuses = ["completed", "failed", "pending"] as const;

export type ClientAuditStatus = (typeof clientAuditStatuses)[number];

export type ClientRecord = {
  id: string;
  name: string;
  websiteUrl: string;
  domain: string;
  contactPerson: string;
  email: string;
  phone: string;
  auditStatus: ClientAuditStatus;
  createdAt: string;
};

export const clientFormSchema = z.object({
  name: z.string().trim().min(2, "Enter the client name.").max(80, "Use 80 characters or fewer."),
  websiteUrl: z
    .string()
    .trim()
    .url("Enter a valid website URL, including https://."),
  contactPerson: z
    .string()
    .trim()
    .min(2, "Enter the contact person.")
    .max(80, "Use 80 characters or fewer."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+().\-\s]{7,20}$/, "Enter a valid phone number."),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

export function domainFromWebsite(websiteUrl: string) {
  return new URL(websiteUrl).hostname.replace(/^www\./, "");
}

export function formatClientDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${Number(day)} ${months[Number(month) - 1]} ${year}`;
}

export function todayIsoDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function createClientRecord(values: ClientFormValues): ClientRecord {
  return {
    id: `client_${crypto.randomUUID()}`,
    name: values.name,
    websiteUrl: values.websiteUrl,
    domain: domainFromWebsite(values.websiteUrl),
    contactPerson: values.contactPerson,
    email: values.email,
    phone: values.phone,
    auditStatus: "pending",
    createdAt: todayIsoDate(),
  };
}

export function applyClientUpdate(client: ClientRecord, values: ClientFormValues): ClientRecord {
  return {
    ...client,
    name: values.name,
    websiteUrl: values.websiteUrl,
    domain: domainFromWebsite(values.websiteUrl),
    contactPerson: values.contactPerson,
    email: values.email,
    phone: values.phone,
  };
}

const fixtureClient: ClientRecord = {
  id: "client_example_dental",
  name: "Example Dental Clinic",
  websiteUrl: "https://example-dental-clinic.com",
  domain: "example-dental-clinic.com",
  contactPerson: "Clinic desk",
  email: "hello@example-dental-clinic.com",
  phone: "+91 20 4000 1100",
  auditStatus: "completed",
  createdAt: "2026-06-02",
};

export const initialClients: ClientRecord[] = [
  fixtureClient,
  {
    id: "client_pune_smiles",
    name: "Pune Smiles Dental",
    websiteUrl: "https://punesmiles.example",
    domain: "punesmiles.example",
    contactPerson: "Asha Kulkarni",
    email: "asha@punesmiles.example",
    phone: "+91 20 4000 1101",
    auditStatus: "pending",
    createdAt: "2026-06-18",
  },
  {
    id: "client_river_estate",
    name: "Riverstone Estates",
    websiteUrl: "https://riverstone.example",
    domain: "riverstone.example",
    contactPerson: "Rohan Mehta",
    email: "rohan@riverstone.example",
    phone: "+91 20 4000 1102",
    auditStatus: "failed",
    createdAt: "2026-05-11",
  },
  {
    id: "client_lakeview",
    name: "Lakeview Family Dental",
    websiteUrl: "https://lakeview-dental.example",
    domain: "lakeview-dental.example",
    contactPerson: "Neha Shah",
    email: "neha@lakeview-dental.example",
    phone: "+91 20 4000 1103",
    auditStatus: "completed",
    createdAt: "2026-04-27",
  },
  {
    id: "client_orchid",
    name: "Orchid Orthodontics",
    websiteUrl: "https://orchid-ortho.example",
    domain: "orchid-ortho.example",
    contactPerson: "Vikram Desai",
    email: "vikram@orchid-ortho.example",
    phone: "+91 20 4000 1104",
    auditStatus: "pending",
    createdAt: "2026-07-03",
  },
  {
    id: "client_greenfield",
    name: "Greenfield Homes",
    websiteUrl: "https://greenfield-homes.example",
    domain: "greenfield-homes.example",
    contactPerson: "Meera Iyer",
    email: "meera@greenfield-homes.example",
    phone: "+91 20 4000 1105",
    auditStatus: "completed",
    createdAt: "2026-03-14",
  },
  {
    id: "client_citycare",
    name: "CityCare Clinic",
    websiteUrl: "https://citycare.example",
    domain: "citycare.example",
    contactPerson: "Arjun Patel",
    email: "arjun@citycare.example",
    phone: "+91 20 4000 1106",
    auditStatus: "failed",
    createdAt: "2026-02-09",
  },
  {
    id: "client_northside",
    name: "Northside Dental Studio",
    websiteUrl: "https://northside-dental.example",
    domain: "northside-dental.example",
    contactPerson: "Lata Joshi",
    email: "lata@northside-dental.example",
    phone: "+91 20 4000 1107",
    auditStatus: "pending",
    createdAt: "2026-08-01",
  },
];
