"use client";
import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

const queryClient = new QueryClient();

export function AppProviders({
  children,
  locale,
  messages,
  timeZone,
}: {
  children: ReactNode;
  locale: string;
  messages?: Record<string, any>;
  timeZone?: string;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider
        locale={locale}
        messages={messages || {}}
        timeZone={timeZone || "Africa/Tunis"}
      >
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}
