import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-500">
      <SignIn routing="path" path="/auth/sign-in" />
    </div>
  );
}
