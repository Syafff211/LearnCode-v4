import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

type SelectConfig = {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
};

export function FilterBar({
  action,
  query,
  searchValue,
  placeholder,
  selects = [],
  resetHref,
}: {
  action: string;
  query: string;
  searchValue: string;
  placeholder: string;
  selects?: SelectConfig[];
  resetHref: string;
}) {
  return (
    <form
      action={action}
      method="get"
      className="flex flex-wrap items-end gap-2 rounded-[8px] border border-line bg-surface p-3"
    >
      <div className="min-w-[13rem] flex-1">
        <label htmlFor={`${query}-search`} className="mb-1 block text-[11px] font-medium text-muted">
          Cari
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <Input
            id={`${query}-search`}
            name="q"
            type="search"
            defaultValue={searchValue}
            placeholder={placeholder}
            maxLength={80}
            className="h-9 pl-8 text-[0.8125rem]"
          />
        </div>
      </div>

      {selects.map((select) => (
        <div key={select.name} className="min-w-[9rem]">
          <label
            htmlFor={`${query}-${select.name}`}
            className="mb-1 block text-[11px] font-medium text-muted"
          >
            {select.label}
          </label>
          <Select
            id={`${query}-${select.name}`}
            name={select.name}
            defaultValue={select.value}
            className="h-9 text-[0.8125rem]"
          >
            {select.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      ))}

      <Button type="submit" size="sm" variant="secondary" className="h-9">
        <SlidersHorizontal aria-hidden="true" />
        Terapkan
      </Button>
      <Button asChild size="sm" variant="ghost" className="h-9">
        <Link href={resetHref}>Reset</Link>
      </Button>
    </form>
  );
}
