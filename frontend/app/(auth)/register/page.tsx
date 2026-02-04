import { RegisterForm } from "@/components/RegisterForm";
import { WelcomePanel } from "@/components/WelcomePanel";
import { Card } from "@/components/ui/card";

export default function Register() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 py-12 px-4">
      <Card className="flex w-full max-w-5xl overflow-hidden shadow-2xl">
        {/* Left Panel - Welcome Section */}
        <div className="hidden md:block md:w-1/2">
          <WelcomePanel type="register" />
        </div>

        {/* Right Panel - Register Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center bg-white">
          <RegisterForm />
        </div>
      </Card>
    </div>
  );
}
