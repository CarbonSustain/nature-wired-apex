import { useEffect, useState } from "react";
import SignIn from "./auth/signin";

export default function Home() {
  return (
    <div className="min-h-screen">
      <SignIn />
    </div>
  );
}
