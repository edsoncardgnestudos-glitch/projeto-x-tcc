import { CalendarCheck2, ClipboardList } from 'lucide-react'

interface MetricsCardsProps {
  openCount: number
  completedCount: number
  totalCount: number
}

export default function MetricsCards({
  openCount,
  completedCount,
  totalCount,
}: MetricsCardsProps) {
  const cards = [
    {
      label: 'Vagas Abertas',
      value: openCount,
      icon: <CalendarCheck2 size={22} />,
      color: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
    },
    {
      label: 'Plantões Concluídos',
      value: completedCount,
      icon: <ClipboardList size={22} />,
      color: 'bg-indigo-50 text-indigo-600',
      border: 'border-indigo-100',
    },
    {
      label: 'Total Publicados',
      value: totalCount,
      icon: <CalendarCheck2 size={22} />,
      color: 'bg-slate-100 text-slate-600',
      border: 'border-slate-200',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-white rounded-2xl border ${card.border} p-5 shadow-sm flex items-center gap-4`}
        >
          <div className={`rounded-xl p-2.5 ${card.color}`}>{card.icon}</div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{card.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
