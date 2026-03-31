import dynamic from "next/dynamic";

const AccountOrders = dynamic(() => import("@/components/AccountOrders"), {
  ssr: false,
});

export default function AccountPage() {
  return <AccountOrders />;
}

