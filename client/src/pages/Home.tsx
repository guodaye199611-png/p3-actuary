import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CalculatorTab from '@/components/CalculatorTab';
import ReviewTab from '@/components/ReviewTab';

export default function Home() {
  const [currentPeriod, setCurrentPeriod] = useState('');

  // 计算下一期期号
  const getNextPeriod = (period: string): string => {
    if (!period || period.length < 7) return '';
    const num = parseInt(period.slice(-3), 10);
    const nextNum = (num + 1) % 1000;
    const prefix = period.slice(0, -3);
    return prefix + String(nextNum).padStart(3, '0');
  };

  // 自动计算下一期
  useEffect(() => {
    if (currentPeriod) {
      const nextPeriod = getNextPeriod(currentPeriod);
      setCurrentPeriod(nextPeriod);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 顶部导航栏 */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-display font-bold text-accent">
              体彩P3
            </div>
            <div className="text-sm text-muted-foreground">
              组选精算器
            </div>
          </div>
          <div className="text-sm font-mono bg-secondary px-3 py-1 rounded border border-border">
            {currentPeriod || '未输入'}期
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="calculator">精算台</TabsTrigger>
            <TabsTrigger value="review">复盘</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            <CalculatorTab
              currentPeriod={currentPeriod}
              onPeriodChange={setCurrentPeriod}
            />
          </TabsContent>

          <TabsContent value="review" className="space-y-6">
            <ReviewTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
