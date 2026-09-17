import { Button } from "@/src/components/ui/Button";
import { UserPlus } from "lucide-react";
import { naira } from "./methodbadge";
import { FeeStructure } from "@/src/types/fees";

export function FeeCard({
  structure,
  onAssign,
}: {
  structure: FeeStructure;
  onAssign:  () => void;
}) {
  return ( 
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{structure.name}</p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {structure.class && (
              <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                {structure.class.level}
              </span>
            )}
            {structure.isOptional && (
              <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                Optional
              </span>
            )}
          </div>
        </div>
        <p className="text-lg font-black text-gray-900 shrink-0">
          {naira(structure.amount)}
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full flex items-center justify-center gap-2"
        onClick={onAssign}
      >
        <UserPlus size={14} />
        Assign to Class
      </Button>
    </div>
  );
}