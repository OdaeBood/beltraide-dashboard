// src/components/CoopList.tsx
type Coop = {
  id: string;
  cooperativeName: string;
};

export default function CoopList({
  data,
  onSelect,
}: {
  data: Coop[];
  onSelect?: (c: Coop) => void;
}) {
  return (
    <div className="max-h-[300px] overflow-auto">
      {data.map((c) => (
        <div
          key={c.id}
          className="grid grid-cols-10 px-4 py-3 items-center hover:bg-[#151515] cursor-pointer text-sm"
          style={{ borderTop: "1px solid #262626" }}
          onClick={() => onSelect?.(c)}
        >
          <div className="font-medium text-white">{c.cooperativeName}</div>
        </div>
      ))}
    </div>
  );
}
