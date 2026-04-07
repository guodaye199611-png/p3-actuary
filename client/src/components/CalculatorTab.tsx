import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { calculateP3, CalculationResult } from '@/lib/p3Calculator';
import { useP3Storage, StoredRecord } from '@/hooks/useP3Storage';
import CombinationGrid from './CombinationGrid';

interface CalculatorTabProps {
  currentPeriod: string;
  onPeriodChange: (period: string) => void;
}

export default function CalculatorTab({ currentPeriod, onPeriodChange }: CalculatorTabProps) {
  const [period, setPeriod] = useState(currentPeriod);
  const [n1, setN1] = useState('');
  const [n2, setN2] = useState('');
  const [n3, setN3] = useState('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const { addRecord, getLastThreeRecords } = useP3Storage();

  // 验证输入
  const validateInput = (value: string): boolean => {
    if (!value || value.length !== 3) return false;
    return /^\d{3}$/.test(value) && value.split('').every(d => /\d/.test(d));
  };

  // 计算下一期
  const getNextPeriod = (p: string): string => {
    if (!p || p.length < 7) return '';
    const num = parseInt(p.slice(-3), 10);
    const nextNum = (num + 1) % 1000;
    const prefix = p.slice(0, -3);
    return prefix + String(nextNum).padStart(3, '0');
  };

  // 处理期号输入
  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    if (value.length === 7) {
      // 自动填充下一期
      const nextPeriod = getNextPeriod(value);
      onPeriodChange(nextPeriod);
    }
  };

  // 处理计算
  const handleCalculate = async () => {
    if (!validateInput(n1) || !validateInput(n2) || !validateInput(n3)) {
      toast.error('请输入三个有效的三位数字（N-1、N-2、N-3）');
      return;
    }

    if (!period || period.length < 7) {
      toast.error('请输入有效的期号');
      return;
    }

    setLoading(true);
    try {
      const calcResult = calculateP3(n1, n2, n3);
      calcResult.period = period;

      setResult(calcResult);

      // 保存到本地存储
      const record: StoredRecord = {
        period,
        n1,
        n2,
        n3,
        result: calcResult,
        timestamp: Date.now(),
      };
      addRecord(record);

      if (calcResult.radarStatus.isBlocked) {
        toast.warning(`当日停火：${calcResult.radarStatus.blockReason}`);
      } else if (calcResult.isDeadlock) {
        toast.warning('物理死锁：无有效组合');
      } else {
        toast.success(`成功推演 ${calcResult.count} 注`);
      }
    } catch (error) {
      console.error('Calculation error:', error);
      toast.error('计算出错，请检查输入');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 输入卡片 */}
      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg">录入开奖号</CardTitle>
          <CardDescription>输入当期及前两期的开奖号</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 期号输入 */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              期号
            </label>
            <Input
              type="text"
              placeholder="如 2026087"
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="font-mono text-lg text-center"
            />
          </div>

          {/* 开奖号输入 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                N-1 (上期)
              </label>
              <Input
                type="text"
                placeholder="000"
                value={n1}
                onChange={(e) => setN1(e.target.value.slice(0, 3))}
                maxLength={3}
                className="font-mono text-lg text-center"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                N-2 (上上期)
              </label>
              <Input
                type="text"
                placeholder="000"
                value={n2}
                onChange={(e) => setN2(e.target.value.slice(0, 3))}
                maxLength={3}
                className="font-mono text-lg text-center"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                N-3 (上三期)
              </label>
              <Input
                type="text"
                placeholder="000"
                value={n3}
                onChange={(e) => setN3(e.target.value.slice(0, 3))}
                maxLength={3}
                className="font-mono text-lg text-center"
              />
            </div>
          </div>

          {/* 提交按钮 */}
          <Button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6 text-base"
          >
            {loading ? '计算中...' : '录入开奖并推演'}
          </Button>
        </CardContent>
      </Card>

      {/* 结果展示 */}
      {result && (
        <div className="space-y-4">
          {/* 雷达状态 */}
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-base">双子星雷达</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-secondary rounded border border-border">
                  <div className="text-sm text-muted-foreground mb-1">雷达一（能量自噬）</div>
                  <div className={`text-lg font-mono font-bold ${result.radarStatus.radarOne ? 'text-destructive' : 'text-green-500'}`}>
                    {result.radarStatus.radarOne ? '⚠️ 触碰' : '✓ 通过'}
                  </div>
                </div>
                <div className="p-3 bg-secondary rounded border border-border">
                  <div className="text-sm text-muted-foreground mb-1">雷达二（核心坍缩）</div>
                  <div className={`text-lg font-mono font-bold ${result.radarStatus.radarTwo ? 'text-destructive' : 'text-green-500'}`}>
                    {result.radarStatus.radarTwo ? '⚠️ 触碰' : '✓ 通过'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 阻挡状态 */}
          {result.radarStatus.isBlocked && (
            <Card className="border-destructive/50 bg-destructive/10">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-destructive mb-2">
                    当日强制停火
                  </div>
                  <div className="text-sm text-muted-foreground">
                    阻挡原因：{result.radarStatus.blockReason}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 物理死锁状态 */}
          {result.isDeadlock && (
            <Card className="border-destructive/50 bg-destructive/10">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-destructive mb-2">
                    物理死锁
                  </div>
                  <div className="text-sm text-muted-foreground">
                    D 与 N-3 无交集，无有效组合
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 推演结果 */}
          {!result.radarStatus.isBlocked && !result.isDeadlock && result.combinations.length > 0 && (
            <Card className="border-border bg-card/50">
              <CardHeader>
                <CardTitle className="text-base">推演结果</CardTitle>
                <CardDescription>
                  共 {result.count} 注，全量 1 倍投注
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CombinationGrid combinations={result.combinations} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
