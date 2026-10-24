import { allowedEmailDomains } from "@dayotter/auth";
import { SignUpForm } from "./sign-up-form";

// A lista vem do deploy/.env em tempo de execução; sem isto o build congelaria a lista vazia.
export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return <SignUpForm domains={allowedEmailDomains()} />;
}
