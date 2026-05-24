export default function Loading() {
  return (
    <div className="flex flex-col h-full p-4 space-y-4 animate-pulse">
      <div className="flex-1 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <div className={`h-12 rounded-2xl bg-[#0e0e0e] border border-[#1a1a1a] ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} />
          </div>
        ))}
      </div>
      <div className="h-12 bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl" />
    </div>
  )
}
