import { useState, useEffect } from 'react';
import { CalculationResult } from '@/lib/p3Calculator';

export interface StoredRecord {
  period: string;
  n1: string;
  n2: string;
  n3: string;
  actualNumbers?: string; // 实际开奖号
  result: CalculationResult;
  timestamp: number;
}

const STORAGE_KEY = 'p3_calculator_records';

/**
 * 本地存储 Hook
 */
export function useP3Storage() {
  const [records, setRecords] = useState<StoredRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 初始化：从 localStorage 加载数据
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecords(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error('Failed to parse stored records:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // 保存到 localStorage
  const saveRecords = (newRecords: StoredRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
  };

  // 添加新记录
  const addRecord = (record: StoredRecord) => {
    const updated = [record, ...records];
    saveRecords(updated);
  };

  // 更新指定期号的实际开奖号
  const updateActualNumbers = (period: string, actualNumbers: string) => {
    const updated = records.map(r =>
      r.period === period ? { ...r, actualNumbers } : r
    );
    saveRecords(updated);
  };

  // 删除指定期号的记录
  const deleteRecord = (period: string) => {
    const updated = records.filter(r => r.period !== period);
    saveRecords(updated);
  };

  // 清空所有记录
  const clearAll = () => {
    saveRecords([]);
  };

  // 获取最近的三期记录（用于计算 N-1, N-2, N-3）
  const getLastThreeRecords = () => {
    return records.slice(0, 3);
  };

  // 获取指定期号的记录
  const getRecord = (period: string) => {
    return records.find(r => r.period === period);
  };

  return {
    records,
    isLoaded,
    addRecord,
    updateActualNumbers,
    deleteRecord,
    clearAll,
    getLastThreeRecords,
    getRecord,
  };
}
