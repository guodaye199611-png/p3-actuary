import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useP3Storage, StoredRecord } from '@/hooks/useP3Storage';
import { checkHit, calculateMissing } from '@/lib/p3Calculator';

export default function ReviewTab() {
  const { records, isLoaded, updateActualNumbers, deleteRecord } = useP3Storage();
  const [editingPeriod, setEditingPeriod] = useState<string | null>(null);
  const [editingNumbers, setEditingNumbers] = useState('');

  const handleSaveActualNumbers = (period: string) => {
    if (!editingNumbers || editingNumbers.length !== 3 || !/^\d{3}$/.test(editingNumbers)) {
      toast.error('请输入有效的三位数字');
      return;
    }

    updateActualNumbers(period, editingNumbers);
    setEditingPeriod(null);
    setEditingNumbers('');
    toast.success('已保存开奖号');
  };

  const handleDeleteRecord = (period: string) => {
    deleteRecord(period);
    toast.success('已删除记录');
  };

  if (!isLoaded) {
    return <div className="text-center text-muted-foreground">加载中...</div>;
  }

  if (records.length === 0) {
    return (
      <Card className="border-border bg-card/50">
        <CardContent className="pt-6 text-center text-muted-foreground">
          暂无记录，请先在精算台中输入开奖号
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => {
        const isHit = record.actualNumbers ? checkHit(record.result.combinations, record.actualNumbers) : null;
        const missingReason = record.actualNumbers
          ? calculateMissing(
              record.result.radarStatus,
              record.n1,
              record.n2,
              record.n3,
              record.actualNumbers
            )
          : '-';

        return (
          <Card key={record.period} className="border-border bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-mono">{record.period} 期</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    N-1: {record.n1} | N-2: {record.n2} | N-3: {record.n3}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteRecord(record.period)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  删除
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3 text-sm">
                {/* 开奖号 */}
                <div className="p-3 bg-secondary rounded border border-border">
                  <div className="text-xs text-muted-foreground mb-1">开奖</div>
                  {editingPeriod === record.period ? (
                    <div className="flex gap-1">
                      <Input
                        type="text"
                        placeholder="000"
                        value={editingNumbers}
                        onChange={(e) => setEditingNumbers(e.target.value.slice(0, 3))}
                        maxLength={3}
                        className="font-mono text-center text-base py-1 h-auto"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveActualNumbers(record.period)}
                        className="px-2"
                      >
                        保存
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setEditingPeriod(record.period);
                        setEditingNumbers(record.actualNumbers || '');
                      }}
                      className="font-mono font-bold text-lg cursor-pointer hover:text-accent transition-colors"
                    >
                      {record.actualNumbers || '未输入'}
                    </div>
                  )}
                </div>

                {/* 注数 */}
                <div className="p-3 bg-secondary rounded border border-border">
                  <div className="text-xs text-muted-foreground mb-1">注数</div>
                  <div className="font-mono font-bold text-lg">
                    {record.result.radarStatus.isBlocked || record.result.isDeadlock
                      ? '0'
                      : record.result.count}
                  </div>
                </div>

                {/* 结果 */}
                <div className="p-3 bg-secondary rounded border border-border">
                  <div className="text-xs text-muted-foreground mb-1">结果</div>
                  <div className={`font-mono font-bold text-lg ${
                    isHit === null ? 'text-muted-foreground' : isHit ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {isHit === null ? '-' : isHit ? '命中' : '未中'}
                  </div>
                </div>

                {/* 误杀 */}
                <div className="p-3 bg-secondary rounded border border-border">
                  <div className="text-xs text-muted-foreground mb-1">误杀</div>
                  <div className={`font-mono font-bold text-lg ${
                    missingReason !== '-' ? 'text-yellow-500' : 'text-muted-foreground'
                  }`}>
                    {missingReason}
                  </div>
                </div>
              </div>

              {/* 推演组合预览 */}
              {!record.result.radarStatus.isBlocked && !record.result.isDeadlock && record.result.combinations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-2">推演组合</div>
                  <div className="flex flex-wrap gap-2">
                    {record.result.combinations.slice(0, 10).map((combo, idx) => (
                      <div
                        key={idx}
                        className={`px-2 py-1 bg-secondary rounded text-xs font-mono ${
                          record.actualNumbers && checkHit([combo], record.actualNumbers)
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'border border-border'
                        }`}
                      >
                        {combo.join('')}
                      </div>
                    ))}
                    {record.result.combinations.length > 10 && (
                      <div className="px-2 py-1 text-xs text-muted-foreground">
                        +{record.result.combinations.length - 10} 注
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
