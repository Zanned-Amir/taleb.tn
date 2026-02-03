import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("LoginPage");
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-4xl font-bold text-zinc-800 dark:text-zinc-200">
        {t("welcome")}
      </h1>
    </div>
  );
}
