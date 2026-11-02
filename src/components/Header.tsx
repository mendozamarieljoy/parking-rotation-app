"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const menus = [
    { label: "Rules & Guidelines", href: "/parking/guidelines" },
    { label: "Schedule Today", href: "/parking/today" },
    { label: "Calendar", href: "/parking" },
    { label: "Admin", href: "/admin/holidays" },
  ];

  const isActive = (href: string) => {
    return pathname === href;
  };

  return (
    <div className="sticky top-0 w-full p-4 flex flex-col md:flex-row justify-between items-center gap-x-4 bg-slate-800 text-white shadow z-50">
      <button
        onClick={() => router.push("/")}
        className="text-lg uppercase text-white font-bold font-mono"
      >
        Parking Rotation System
      </button>
      <div className="flex items-center gap-x-4 mt-4 md:mt-0">
        {menus.map((menu) => (
          <Link
            href={menu.href}
            key={menu.href}
            className={`text-xs md:text-sm uppercase text-center font-mono ${isActive(menu.href) ? "border-b font-black text-slate-100" : "hover:border-b"}`}
          >
            {menu.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
