import Lamba, { MOODS } from "@/components/Lamba";

export const metadata = { title: "Lamba moods" };

/** Dev preview of every Lamba mood. Not linked from the app. */
export default function LambaPreview() {
  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Lamba moods</h1>
      <ul className="grid grid-cols-2 gap-4">
        {MOODS.map((mood) => (
          <li key={mood} className="flex flex-col items-center rounded-2xl bg-amber-50 p-3">
            <Lamba mood={mood} size={160} priority />
            <span className="mt-1 text-sm font-medium capitalize text-stone-700">{mood}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
