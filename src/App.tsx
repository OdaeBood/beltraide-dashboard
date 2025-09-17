import CoopList from "./components/CoopList";

export default function App() {
  // sample data for now
  const data = [
    { id: "1", cooperativeName: "Coop A" },
    { id: "2", cooperativeName: "Coop B" },
    { id: "3", cooperativeName: "Coop C" },
  ];

  const handleSelect = (coop: { id: string; cooperativeName: string }) => {
    console.log("Selected:", coop);
  };

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold">Beltraide Dashboard</h1>
      <p className="text-zinc-400">GitHub Pages build via Actions</p>

      {/* Render your CoopList here */}
      <CoopList data={data} onSelect={handleSelect} />
    </main>
  );
}
