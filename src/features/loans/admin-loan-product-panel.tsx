"use client";

import { Pencil, PlusCircle } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { LoanProduct } from "./data";
import { formatPeso } from "./loan-utils";

type ProductFormState = {
  id?: string;
  code: string;
  name: string;
  description: string;
  minAmount: string;
  maxAmount: string;
  minTermMonths: string;
  maxTermMonths: string;
  interestRatePercent: string;
  isActive: boolean;
};

const emptyProduct: ProductFormState = {
  code: "",
  name: "",
  description: "",
  minAmount: "0",
  maxAmount: "",
  minTermMonths: "1",
  maxTermMonths: "",
  interestRatePercent: "",
  isActive: true
};

function productToForm(product: LoanProduct): ProductFormState {
  return {
    id: product.id,
    code: product.code,
    name: product.name,
    description: product.description ?? "",
    minAmount: String(product.min_amount),
    maxAmount: String(product.max_amount),
    minTermMonths: String(product.min_term_months),
    maxTermMonths: String(product.max_term_months),
    interestRatePercent: product.interest_rate_percent === null ? "" : String(product.interest_rate_percent),
    isActive: product.is_active
  };
}

export function AdminLoanProductPanel({ products }: { products: LoanProduct[] }) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormState>(emptyProduct);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const activeCount = useMemo(
    () => products.filter((product) => product.is_active).length,
    [products]
  );

  function setField<Key extends keyof ProductFormState>(
    key: Key,
    value: ProductFormState[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const payload = {
      code: form.code,
      name: form.name,
      description: form.description,
      minAmount: form.minAmount,
      maxAmount: form.maxAmount,
      minTermMonths: form.minTermMonths,
      maxTermMonths: form.maxTermMonths,
      interestRatePercent: form.interestRatePercent === "" ? null : form.interestRatePercent,
      isActive: form.isActive
    };

    try {
      const response = await fetch(
        form.id ? `/api/admin/loan-products/${form.id}` : "/api/admin/loan-products",
        {
          method: form.id ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error ?? "Loan product could not be saved.");
      }

      setForm(emptyProduct);
      setMessage("Loan product saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Loan product could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="grid gap-5 rounded-lg border border-[#d8e1ea] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#10233f]">Loan products</h2>
          <p className="mt-1 text-sm text-[#5f6c7b]">
            Active products appear on the member loan application form.
          </p>
        </div>
        <StatusBadge tone={activeCount > 0 ? "success" : "warning"}>
          {activeCount} active
        </StatusBadge>
      </div>

      <form className="grid gap-4" onSubmit={saveProduct}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-2 text-sm font-semibold text-[#344456]">
            Code
            <input
              className="min-h-10 rounded-md border border-[#cbd7e3] bg-white px-3 text-sm uppercase text-[#17263a]"
              value={form.code}
              onChange={(event) => setField("code", event.target.value.toUpperCase())}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#344456] sm:col-span-1 lg:col-span-3">
            Name
            <input
              className="min-h-10 rounded-md border border-[#cbd7e3] bg-white px-3 text-sm text-[#17263a]"
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              required
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-semibold text-[#344456]">
          Description
          <textarea
            className="min-h-20 rounded-md border border-[#cbd7e3] bg-white px-3 py-2 text-sm leading-6 text-[#17263a]"
            value={form.description}
            onChange={(event) => setField("description", event.target.value)}
            maxLength={500}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="grid gap-2 text-sm font-semibold text-[#344456]">
            Min amount
            <input
              className="min-h-10 rounded-md border border-[#cbd7e3] bg-white px-3 text-sm text-[#17263a]"
              type="number"
              min="0"
              step="0.01"
              value={form.minAmount}
              onChange={(event) => setField("minAmount", event.target.value)}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#344456]">
            Max amount
            <input
              className="min-h-10 rounded-md border border-[#cbd7e3] bg-white px-3 text-sm text-[#17263a]"
              type="number"
              min="1"
              step="0.01"
              value={form.maxAmount}
              onChange={(event) => setField("maxAmount", event.target.value)}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#344456]">
            Min term
            <input
              className="min-h-10 rounded-md border border-[#cbd7e3] bg-white px-3 text-sm text-[#17263a]"
              type="number"
              min="1"
              value={form.minTermMonths}
              onChange={(event) => setField("minTermMonths", event.target.value)}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#344456]">
            Max term
            <input
              className="min-h-10 rounded-md border border-[#cbd7e3] bg-white px-3 text-sm text-[#17263a]"
              type="number"
              min="1"
              value={form.maxTermMonths}
              onChange={(event) => setField("maxTermMonths", event.target.value)}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#344456]">
            Interest %
            <input
              className="min-h-10 rounded-md border border-[#cbd7e3] bg-white px-3 text-sm text-[#17263a]"
              type="number"
              min="0"
              step="0.0001"
              value={form.interestRatePercent}
              onChange={(event) => setField("interestRatePercent", event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#344456]">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setField("isActive", event.target.checked)}
            />
            Active for member applications
          </label>
          <div className="flex flex-wrap gap-2">
            {form.id ? (
              <Button type="button" intent="secondary" onClick={() => setForm(emptyProduct)}>
                New product
              </Button>
            ) : null}
            <Button type="submit" disabled={isSaving}>
              <PlusCircle aria-hidden size={18} />
              {isSaving ? "Saving..." : form.id ? "Update product" : "Create product"}
            </Button>
          </div>
        </div>

        {message ? <p className="text-sm font-medium text-[#344456]">{message}</p> : null}
      </form>

      <div className="overflow-x-auto rounded-md border border-[#e1e8ef]">
        <table className="min-w-full divide-y divide-[#e1e8ef] text-left text-sm">
          <thead className="bg-[#edf3f8] text-[#344456]">
            <tr>
              <th className="px-3 py-2 font-semibold">Product</th>
              <th className="px-3 py-2 font-semibold">Amount range</th>
              <th className="px-3 py-2 font-semibold">Term</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e1e8ef]">
            {products.length > 0 ? (
              products.map((product) => (
                <tr key={product.id}>
                  <td className="px-3 py-2">
                    <span className="block font-semibold text-[#10233f]">{product.name}</span>
                    <span className="text-xs text-[#5f6c7b]">{product.code}</span>
                  </td>
                  <td className="px-3 py-2">
                    {formatPeso(product.min_amount)} - {formatPeso(product.max_amount)}
                  </td>
                  <td className="px-3 py-2">
                    {product.min_term_months}-{product.max_term_months} months
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge tone={product.is_active ? "success" : "neutral"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      type="button"
                      intent="secondary"
                      className="min-h-9 px-3 py-1"
                      onClick={() => setForm(productToForm(product))}
                    >
                      <Pencil aria-hidden size={16} />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-6 text-center text-[#5f6c7b]" colSpan={5}>
                  No loan products configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
