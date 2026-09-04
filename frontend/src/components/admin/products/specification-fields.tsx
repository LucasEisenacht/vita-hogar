"use client";

import { useState } from "react";

export type SpecificationRow = {
  id: string;
  label: string;
  value: string;
};

type SpecificationFieldsProps = {
  addLabel?: string;
  description?: string;
  initialLabelPlaceholder?: string;
  initialRows?: Array<SpecificationRow>;
  labelName?: string;
  legend?: string;
  rowIdPrefix?: string;
  valueName?: string;
  valuePlaceholder?: string;
};

const emptyRow: SpecificationRow = {
  id: "specification-1",
  label: "",
  value: "",
};

function createRow(rowIdPrefix: string) {
  return {
    id: `${rowIdPrefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    label: "",
    value: "",
  };
}

export function SpecificationFields({
  addLabel = "Agregar especificacion",
  description = "Agrega pares simples, por ejemplo Material y Silicona.",
  initialLabelPlaceholder = "Material",
  initialRows = [emptyRow],
  labelName = "specificationLabel",
  legend = "Especificaciones",
  rowIdPrefix = "specification",
  valueName = "specificationValue",
  valuePlaceholder = "Silicona",
}: SpecificationFieldsProps) {
  const [rows, setRows] = useState<Array<SpecificationRow>>(
    initialRows.length > 0 ? initialRows : [emptyRow],
  );

  function updateRow(
    rowId: string,
    field: "label" | "value",
    nextValue: string,
  ) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId ? { ...row, [field]: nextValue } : row,
      ),
    );
  }

  function removeRow(rowId: string) {
    setRows((currentRows) => {
      const nextRows = currentRows.filter((row) => row.id !== rowId);

      return nextRows.length > 0 ? nextRows : [createRow(rowIdPrefix)];
    });
  }

  function moveRow(rowId: string, direction: "down" | "up") {
    setRows((currentRows) => {
      const currentIndex = currentRows.findIndex((row) => row.id === rowId);
      const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (
        currentIndex < 0 ||
        nextIndex < 0 ||
        nextIndex >= currentRows.length
      ) {
        return currentRows;
      }

      const nextRows = [...currentRows];
      const [currentRow] = nextRows.splice(currentIndex, 1);
      nextRows.splice(nextIndex, 0, currentRow);

      return nextRows;
    });
  }

  const labelCounts = rows.reduce((counts, row) => {
    const normalizedLabel = row.label.trim().toLowerCase();

    if (normalizedLabel) {
      counts.set(normalizedLabel, (counts.get(normalizedLabel) ?? 0) + 1);
    }

    return counts;
  }, new Map<string, number>());

  const hasDuplicateLabels = Array.from(labelCounts.values()).some(
    (count) => count > 1,
  );
  const hasIncompleteRows = rows.some(
    (row) =>
      (row.label.trim().length > 0 && row.value.trim().length === 0) ||
      (row.value.trim().length > 0 && row.label.trim().length === 0),
  );

  return (
    <fieldset className="space-y-4">
      <div className="space-y-1">
        <legend className="text-sm font-semibold text-foreground">
          {legend}
        </legend>
        <p className="text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="grid gap-3">
        {rows.map((row, index) => (
          <div
            className="grid gap-3 rounded-[24px] border border-border bg-surface-soft p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
            key={row.id}
          >
            <label className="grid gap-2 text-sm font-semibold text-foreground">
              Nombre
              <input
                className="h-11 rounded-2xl border border-border bg-surface px-4 text-sm font-normal text-foreground shadow-[0_10px_24px_rgba(74,55,47,0.04)] transition-all duration-[250ms] focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/35"
                name={labelName}
                onChange={(event) =>
                  updateRow(row.id, "label", event.target.value)
                }
                placeholder={index === 0 ? initialLabelPlaceholder : "Nombre"}
                value={row.label}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-foreground">
              Valor
              <input
                className="h-11 rounded-2xl border border-border bg-surface px-4 text-sm font-normal text-foreground shadow-[0_10px_24px_rgba(74,55,47,0.04)] transition-all duration-[250ms] focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/35"
                name={valueName}
                onChange={(event) =>
                  updateRow(row.id, "value", event.target.value)
                }
                placeholder={index === 0 ? valuePlaceholder : "Valor"}
                value={row.value}
              />
            </label>
            <div className="flex flex-wrap items-end gap-2 self-end">
              <button
                aria-label={`Subir fila ${index + 1}`}
                className="rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors duration-[250ms] hover:bg-surface hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-45"
                disabled={index === 0}
                onClick={() => moveRow(row.id, "up")}
                type="button"
              >
                Subir
              </button>
              <button
                aria-label={`Bajar fila ${index + 1}`}
                className="rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors duration-[250ms] hover:bg-surface hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-45"
                disabled={index === rows.length - 1}
                onClick={() => moveRow(row.id, "down")}
                type="button"
              >
                Bajar
              </button>
              <button
                className="rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors duration-[250ms] hover:bg-surface hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onClick={() => removeRow(row.id)}
                type="button"
              >
                Quitar
              </button>
            </div>
          </div>
        ))}
      </div>

      {hasDuplicateLabels || hasIncompleteRows ? (
        <p
          aria-live="polite"
          className="rounded-[18px] border border-warning/25 bg-[#fff8e8] px-4 py-3 text-sm font-medium leading-6 text-[#8a6a24]"
        >
          {hasDuplicateLabels
            ? "Hay claves repetidas. Al guardar, se conserva la primera clave valida."
            : "Hay filas incompletas. Solo se guardan pares con nombre y valor."}
        </p>
      ) : null}

      <button
        className="rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground transition-all duration-[250ms] hover:-translate-y-0.5 hover:border-primary hover:text-primary-hover hover:shadow-[0_14px_30px_rgba(74,55,47,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        onClick={() =>
          setRows((currentRows) => [...currentRows, createRow(rowIdPrefix)])
        }
        type="button"
      >
        {addLabel}
      </button>
    </fieldset>
  );
}
