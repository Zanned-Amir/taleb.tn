"use client";
import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

const queryClient = new QueryClient();

export function AppProviders({
  children,
  locale,
}: {
  children: ReactNode;
  locale: string;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={locale}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}
