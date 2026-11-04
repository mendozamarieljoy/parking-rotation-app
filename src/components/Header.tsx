"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const menus = [
    { label: "Rules & Guidelines", href: "/parking/guidelines" },
    { label: "Schedule Today", href: "/parking/today" },
    { label: "Calendar", href: "/parking" },
    { label: "Requests", href: "/parking/requests" },
  ];

  const isActive = (href: string) => {
    return pathname === href;
  };

  return (
    <div className="sticky top-0 w-full p-4 flex flex-col md:flex-row justify-between items-center gap-x-4 bg-slate-800 text-white shadow z-50">
      <p className="text-lg uppercase text-white font-bold font-mono">
        Parking Rotation System
      </p>
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
