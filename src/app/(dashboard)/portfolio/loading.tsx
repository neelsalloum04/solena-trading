export default function Loading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-7 w-40 bg-[#111] rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl" />
        ))}
      </div>
      <div className="h-72 bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl" />
    </div>
  )
}
