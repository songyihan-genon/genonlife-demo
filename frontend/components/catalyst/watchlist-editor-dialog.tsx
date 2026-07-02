import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { WatchlistStock } from "@/types/domain"
import {
  STOCK_MARKET_OPTIONS,
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
  getDefaultCurrencyForMarket,
  normalizeCurrencyValue,
  generateStockId,
} from "@/lib/mock/stock-data"

interface WatchlistEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialWatchlist: WatchlistStock[]
  onSave: (stocks: WatchlistStock[]) => Promise<void>
}

export function WatchlistEditorDialog({
  open,
  onOpenChange,
  initialWatchlist,
  onSave,
}: WatchlistEditorDialogProps) {
  const [editableWatchlist, setEditableWatchlist] = useState<WatchlistStock[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Dialog가 열릴 때 초기값 설정
  useEffect(() => {
    if (open) {
      setEditableWatchlist(
        initialWatchlist.map((stock) => ({
          ...stock,
          id: stock.id || generateStockId(),
          currency: normalizeCurrencyValue(stock.currency, stock.market),
        }))
      )
      setError(null)
      setIsSaving(false)
    }
  }, [open, initialWatchlist])

  const handleEditableFieldChange = (id: string, field: keyof WatchlistStock, value: string) => {
    setEditableWatchlist((prev) =>
      prev.map((stock) =>
        stock.id === id ? { ...stock, [field]: value } : stock
      )
    )
  }

  const handleEditableMarketChange = (id: string, value: string) => {
    setEditableWatchlist((prev) =>
      prev.map((stock) => {
        if (stock.id !== id) return stock
        const nextMarket = value
        const nextCurrency = nextMarket
          ? getDefaultCurrencyForMarket(nextMarket)
          : stock.currency ?? DEFAULT_CURRENCY
        return {
          ...stock,
          market: nextMarket,
          currency: nextCurrency,
        }
      })
    )
  }

  const handleAddEditableStock = () => {
    setEditableWatchlist((prev) => [
      ...prev,
      {
        id: generateStockId(),
        name: "",
        ticker: "",
        market: "KOSPI",
        sector: "",
        currency: getDefaultCurrencyForMarket("KOSPI"),
      },
    ])
  }

  const handleRemoveEditableStock = (id: string) => {
    setEditableWatchlist((prev) => {
      if (prev.length <= 1) {
        return prev
      }
      return prev.filter((stock) => stock.id !== id)
    })
  }

  const handleSave = async () => {
    setError(null)
    const sanitized = editableWatchlist
      .map((stock) => {
        const normalizedMarket = stock.market?.trim().toUpperCase() || null
        return {
          ...stock,
          id: stock.id || generateStockId(),
          name: stock.name?.trim() ?? "",
          ticker: stock.ticker?.trim().toUpperCase() ?? "",
          market: normalizedMarket,
          sector: stock.sector?.trim() || null,
          currency: normalizeCurrencyValue(stock.currency, normalizedMarket),
        }
      })
      .filter((stock) => stock.name && stock.ticker)

    if (!sanitized.length) {
      setError("최소 1개의 종목이 필요합니다.")
      return
    }

    const hasDup = sanitized.some((stock, index) =>
      sanitized.findIndex((item) => item.ticker === stock.ticker) !== index
    )
    if (hasDup) {
      setError("티커(코드)가 중복된 항목이 있습니다.")
      return
    }

    setIsSaving(true)
    try {
      await onSave(sanitized)
      // onSave success -> parent closes dialog
    } catch (err) {
      console.error("Save failed", err)
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[840px]">
        <DialogHeader>
          <DialogTitle>종목 리스트 편집</DialogTitle>
          <DialogDescription>
            분석에 사용할 종목을 추가하거나 제거할 수 있습니다. 저장 시 현재 계정에 연결되어 언제든 불러올 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border border-border rounded-xl text-sm">
              <thead className="bg-muted/60 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">종목명</th>
                  <th className="px-3 py-2 text-left font-semibold">티커</th>
                  <th className="px-3 py-2 text-left font-semibold">시장</th>
                  <th className="px-3 py-2 text-left font-semibold">통화</th>
                  <th className="px-3 py-2 text-left font-semibold">메모/섹터</th>
                  <th className="px-3 py-2 text-right font-semibold">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {editableWatchlist.map((stock, index) => (
                  <tr key={stock.id} className="bg-background">
                    <td className="px-3 py-2 align-middle">
                      <Input
                        className="h-9"
                        value={stock.name}
                        onChange={(e) =>
                          handleEditableFieldChange(stock.id, "name", e.target.value)
                        }
                        placeholder="예: 현대차"
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <Input
                        className="h-9"
                        value={stock.ticker}
                        onChange={(e) =>
                          handleEditableFieldChange(stock.id, "ticker", e.target.value)
                        }
                        placeholder="예: 005380"
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <Select
                        value={stock.market ?? "NONE"}
                        onValueChange={(value) =>
                          handleEditableMarketChange(stock.id, value === "NONE" ? "" : value)
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">미지정</SelectItem>
                          {STOCK_MARKET_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <Select
                        value={stock.currency ?? getDefaultCurrencyForMarket(stock.market)}
                        onValueChange={(value) =>
                          handleEditableFieldChange(stock.id, "currency", value)
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <Input
                        className="h-9"
                        value={stock.sector ?? ""}
                        onChange={(e) =>
                          handleEditableFieldChange(stock.id, "sector", e.target.value)
                        }
                        placeholder="예: 자동차"
                      />
                    </td>
                    <td className="px-3 py-2 align-middle text-right">
                      {editableWatchlist.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveEditableStock(stock.id)}
                          aria-label={`종목 ${index + 1} 제거`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">최소 1개</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="button" variant="outline" size="sm" onClick={handleAddEditableStock}>
            <Plus className="h-4 w-4 mr-1" />
            종목 추가
          </Button>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

