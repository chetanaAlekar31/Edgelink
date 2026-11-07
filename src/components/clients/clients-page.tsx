"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { ClientForm } from "@/components/clients/client-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { SearchFilters, defaultAuditFilters, type AuditFilterValues } from "@/components/ui/search-filters";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import { updateClients, useClientRecords } from "@/lib/client-store";
import {
  applyClientUpdate,
  createClientRecord,
  formatClientDate,
  type ClientAuditStatus,
  type ClientFormValues,
  type ClientRecord,
} from "@/lib/clients";

const pageSize = 5;

const statusTone: Record<ClientAuditStatus, BadgeTone> = {
  completed: "success",
  failed: "danger",
  pending: "warning",
};

const statusLabel: Record<ClientAuditStatus, string> = {
  completed: "Completed",
  failed: "Failed",
  pending: "Pending",
};

const emptyForm: ClientFormValues = {
  name: "",
  websiteUrl: "",
  contactPerson: "",
  email: "",
  phone: "",
};

export function ClientsPage() {
  const clients = useClientRecords();
  const [filters, setFilters] = useState<AuditFilterValues>(defaultAuditFilters);
  const [applied, setApplied] = useState<AuditFilterValues>(defaultAuditFilters);
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<ClientRecord | null>(null);
  const [editing, setEditing] = useState<ClientRecord | null>(null);
  const [deleting, setDeleting] = useState<ClientRecord | null>(null);

  const filtered = useMemo(() => {
    const query = applied.query.toLowerCase();
    return clients.filter((client) => {
      const matchesQuery =
        query.length === 0 ||
        client.name.toLowerCase().includes(query) ||
        client.domain.toLowerCase().includes(query);
      const matchesStatus = applied.status === "all" || client.auditStatus === applied.status;
      return matchesQuery && matchesStatus;
    });
  }, [applied, clients]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: DataTableColumn<ClientRecord>[] = [
    { id: "name", header: "Client name", cell: (row) => row.name },
    { id: "domain", header: "Website URL / domain", cell: (row) => row.domain },
    { id: "contact", header: "Contact person", cell: (row) => row.contactPerson },
    { id: "email", header: "Email", cell: (row) => row.email },
    { id: "phone", header: "Phone number", cell: (row) => row.phone },
    {
      id: "status",
      header: "SEO audit status",
      cell: (row) => <StatusBadge label={statusLabel[row.auditStatus]} tone={statusTone[row.auditStatus]} />,
    },
    { id: "created", header: "Created date", cell: (row) => formatClientDate(row.createdAt) },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="cs-filter-actions">
          <Button variant="ghost" asChild>
            <Link href={`/clients/${row.id}`}>Dashboard</Link>
          </Button>
          <Button variant="ghost" onClick={() => setViewing(row)}>
            View
          </Button>
          <Button variant="outline" onClick={() => setEditing(row)}>
            Edit
          </Button>
          <Button variant="danger" onClick={() => setDeleting(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  function applyFilters(next: AuditFilterValues) {
    setFilters(next);
    setApplied(next);
    setPage(1);
  }

  return (
    <AppShell title="Clients">
      <PageHeader
        title="Clients"
        description="Manage client websites tracked by the SEO automation portal."
        breadcrumbs={[
          { label: "Admin", href: "/" },
          { label: "Clients" },
        ]}
        actions={
          <Button variant="primary" onClick={() => setAdding(true)}>
            Add client
          </Button>
        }
      />

      <SearchFilters
        values={filters}
        onApply={applyFilters}
        searchId="client-search"
        statusId="client-status"
        searchPlaceholder="Search by name or domain"
      />

      <DataTable
        columns={columns}
        rows={visible}
        getRowId={(row) => row.id}
        emptyTitle="No clients found"
        emptyDescription={
          applied.query || applied.status !== "all"
            ? "No clients match this search or status."
            : "Add a client to start tracking a website."
        }
      />

      <Pagination page={currentPage} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />

      <Sheet open={adding} onOpenChange={setAdding}>
        {adding ? (
          <SheetContent title="Add client" description="The client is stored in this browser session only.">
            <ClientForm
              formId="add-client"
              defaultValues={emptyForm}
              submitLabel="Save client"
              onCancel={() => setAdding(false)}
              onSubmit={(values) => {
                updateClients((current) => [createClientRecord(values), ...current]);
                setPage(1);
                setAdding(false);
              }}
            />
          </SheetContent>
        ) : null}
      </Sheet>

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        {viewing ? (
          <DialogContent title={viewing.name} description="Client details for this prototype record.">
            <dl className="cs-details">
              <Detail label="Client name" value={viewing.name} />
              <Detail label="Website URL" value={viewing.websiteUrl} />
              <Detail label="Domain" value={viewing.domain} />
              <Detail label="Contact person" value={viewing.contactPerson} />
              <Detail label="Email" value={viewing.email} />
              <Detail label="Phone number" value={viewing.phone} />
              <Detail label="SEO audit status" value={statusLabel[viewing.auditStatus]} />
              <Detail label="Created date" value={formatClientDate(viewing.createdAt)} />
            </dl>
            <div className="cs-filter-actions">
              <Button variant="outline" onClick={() => setViewing(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        {editing ? (
          <DialogContent title="Edit client" description={`Update details for ${editing.name}.`}>
            <ClientForm
              key={editing.id}
              formId="edit-client"
              defaultValues={{
                name: editing.name,
                websiteUrl: editing.websiteUrl,
                contactPerson: editing.contactPerson,
                email: editing.email,
                phone: editing.phone,
              }}
              submitLabel="Save changes"
              onCancel={() => setEditing(null)}
              onSubmit={(values) => {
                const currentId = editing.id;
                updateClients((current) =>
                  current.map((client) => (client.id === currentId ? applyClientUpdate(client, values) : client)),
                );
                setEditing(null);
              }}
            />
          </DialogContent>
        ) : null}
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        {deleting ? (
          <AlertDialogContent
            title="Delete client"
            description={`Delete ${deleting.name}? This removes the client from the current session.`}
          >
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="danger"
                onClick={() => {
                  const currentId = deleting.id;
                  updateClients((current) => current.filter((client) => client.id !== currentId));
                  setDeleting(null);
                }}
              >
                Delete client
              </Button>
            </AlertDialogAction>
          </AlertDialogContent>
        ) : null}
      </AlertDialog>
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="cs-caption">{label}</dt>
      <dd className="cs-body">{value}</dd>
    </div>
  );
}
