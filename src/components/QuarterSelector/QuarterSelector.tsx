type QuarterSelectorProps = {
    quarters: number[]
    selectedQuarter: number | null
    onSelect: (quarter: number) => void
}

const QuarterSelector = ({
    quarters,
    selectedQuarter,
    onSelect,
}: QuarterSelectorProps) => {
    if (quarters.length === 0) {
        return (
            <p className="text-sm text-gray-300">No completed quarters yet.</p>
        )
    }

    return (
        <div className="flex gap-2">
            {quarters.map(quarter => (
                <button
                    key={quarter}
                    type="button"
                    aria-pressed={selectedQuarter === quarter}
                    className={cn(
                        "rounded px-4 py-2 transition-colors",
                        selectedQuarter === quarter
                            ? "bg-white/20 text-white"
                            : "bg-white/5 text-gray-300 hover:bg-white/10",
                    )}
                    onClick={() => onSelect(quarter)}
                >
                    Q{quarter}
                </button>
            ))}
        </div>
    )
}

export default QuarterSelector
import {cn} from "~/utils/cn"
