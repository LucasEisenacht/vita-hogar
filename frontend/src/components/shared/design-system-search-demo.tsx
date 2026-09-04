"use client";

import { useState } from "react";
import { SearchField } from "@/components/shared/search-field";

export function DesignSystemSearchDemo() {
  const [search, setSearch] = useState("");

  return (
    <SearchField
      onChange={(event) => setSearch(event.target.value)}
      onClear={() => setSearch("")}
      placeholder="Buscar fundas, cargadores..."
      value={search}
    />
  );
}
