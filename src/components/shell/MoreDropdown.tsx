"use client";

import { useView } from "@/context/ViewContext";
import { moreNavGroups, moreNavExtra } from "@/lib/navigation";

export default function MoreDropdown() {
  const { setView } = useView();

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[560px] max-w-[90vw] bg-paper-bright rounded-2xl border border-warm-gray/15 shadow-[0_20px_50px_rgba(26,26,26,0.15)] p-6 grid grid-cols-2 gap-8 text-left z-50">
      {moreNavGroups.map((group) => {
        const GroupIcon = group.icon;
        return (
          <div key={group.heading}>
            <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-accent uppercase font-bold pb-2 mb-2 border-b border-warm-gray/15">
              <GroupIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{group.heading}</span>
            </div>
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setView(item.id)}
                    className="w-full text-left px-2 py-2 rounded-xl hover:bg-accent/5 transition-editorial cursor-pointer"
                  >
                    <span className="block text-sm font-semibold text-ink">
                      {item.label}
                    </span>
                    <span className="block text-xs text-warm-gray">
                      {item.description}
                    </span>
                  </button>
                </li>
              ))}
              {group.heading === "Contact & Support" && (
                <li className="flex items-center gap-3 pt-2 mt-1">
                  {moreNavExtra.map((extra) => {
                    const ExtraIcon = extra.icon;
                    return (
                      <button
                        key={extra.id}
                        type="button"
                        onClick={() => setView(extra.id)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold text-accent hover:bg-accent/5 transition-editorial cursor-pointer"
                      >
                        <ExtraIcon className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{extra.label}</span>
                      </button>
                    );
                  })}
                </li>
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
