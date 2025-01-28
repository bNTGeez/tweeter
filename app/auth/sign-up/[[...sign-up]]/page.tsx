import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-500">
      <SignUp />;
    </div>
  );
}
