/**
 * P3 组选精算器核心逻辑
 * 
 * 四步精算流程：
 * 1. 双子星雷达（风控闸门）
 * 2. 三要素提取（C、D、N3）
 * 3. 阵列组网（笛卡尔积）
 * 4. F系滤网（杀掉不符合条件的组合）
 */

export interface LotteryData {
  period: string;
  numbers: string; // 三个数字，如 "123"
}

export interface RadarStatus {
  radarOne: boolean; // 能量自噬
  radarTwo: boolean; // 核心坍缩
  isBlocked: boolean; // 是否被雷达阻挡
  blockReason?: string; // 阻挡原因
}

export interface ThreeElements {
  C: number; // 核心
  D: number[]; // 暗池
  N3: number[]; // 锚点
}

export interface CalculationResult {
  period: string;
  n1: string;
  n2: string;
  n3: string;
  radarStatus: RadarStatus;
  threeElements?: ThreeElements;
  combinations: number[][]; // 最终的组合
  count: number; // 注数
  isDeadlock: boolean; // 是否物理死锁
}

export interface ReviewResult extends CalculationResult {
  actualNumbers: string; // 实际开奖号
  isHit: boolean; // 是否中奖
  missingReason?: string; // 误杀原因（雷达一、雷达二、或 -）
}

/**
 * 获取数字的尾数
 */
function getLastDigit(num: number): number {
  return num % 10;
}

/**
 * 计算三个数字的和值
 */
function calculateSum(numbers: string): number {
  const digits = numbers.split('').map(Number);
  return digits.reduce((a, b) => a + b, 0);
}

/**
 * 计算跨度（最大值 - 最小值）
 */
function calculateSpan(numbers: string): number {
  const digits = numbers.split('').map(Number);
  const max = Math.max(...digits);
  const min = Math.min(...digits);
  return max - min;
}

/**
 * 获取数字中出现过的所有数字
 */
function getDigitsInNumber(numbers: string): Set<number> {
  return new Set(numbers.split('').map(Number));
}

/**
 * 第一步：双子星雷达（风控闸门）
 */
export function checkRadar(n1: string, n2: string): RadarStatus {
  const n1Sum = calculateSum(n1);
  const n1SumLastDigit = getLastDigit(n1Sum);
  const n1Digits = getDigitsInNumber(n1);

  // 雷达一：能量自噬
  const radarOne = n1Digits.has(n1SumLastDigit);

  // 雷达二：核心坍缩
  const n2Span = calculateSpan(n2);
  const n2Digits = getDigitsInNumber(n2);
  const radarTwo = n2Digits.has(n2Span);

  const isBlocked = radarOne || radarTwo;
  let blockReason = '';
  if (radarOne) blockReason = '雷达一';
  if (radarTwo) blockReason = blockReason ? '雷达一、雷达二' : '雷达二';

  return {
    radarOne,
    radarTwo,
    isBlocked,
    blockReason: isBlocked ? blockReason : undefined,
  };
}

/**
 * 第二步：提取三要素（C、D、N3）
 */
export function extractThreeElements(n1: string, n2: string, n3: string): ThreeElements | null {
  const n1Sum = calculateSum(n1);
  const isN1SumOdd = n1Sum % 2 === 1;

  // 定 C（核心）
  const n2Digits = n2.split('').map(Number);
  const C = isN1SumOdd ? n2Digits[0] : n2Digits[2]; // 百位或个位

  // 定 D（暗池）
  const n1DigitSet = getDigitsInNumber(n1);
  const n2DigitSet = getDigitsInNumber(n2);
  const usedDigits = new Set([...Array.from(n1DigitSet), ...Array.from(n2DigitSet)]);
  const D = [];
  for (let i = 0; i <= 9; i++) {
    if (!usedDigits.has(i)) {
      D.push(i);
    }
  }

  // 定 N3（锚点）
  const n3DigitSet = getDigitsInNumber(n3);
  const N3 = D.filter(d => n3DigitSet.has(d));

  // 检查物理死锁
  if (N3.length === 0) {
    return null; // 物理死锁
  }

  return { C, D, N3 };
}

/**
 * 第三步：阵列组网（笛卡尔积）
 */
export function generateCombinations(threeElements: ThreeElements): number[][] {
  const { C, D, N3 } = threeElements;
  const combinations: Set<string> = new Set();

  // 生成所有可能的组合
  for (const n3Item of N3) {
    for (const dItem of D) {
      // 创建三个数字的数组
      const trio = [C, n3Item, dItem];
      // 排序后转换为字符串，用于去重（因为是组选，不区分顺序）
      const sorted = trio.sort((a, b) => a - b).join(',');
      combinations.add(sorted);
    }
  }

  // 转换回数字数组
  return Array.from(combinations).map(combo =>
    combo.split(',').map(Number)
  );
}

/**
 * 检查是否是豹子号（三个数字完全相同）
 */
function isPair(combo: number[]): boolean {
  return combo[0] === combo[1] && combo[1] === combo[2];
}

/**
 * 检查和值是否在 8-19 范围内
 */
function isValidSum(combo: number[]): boolean {
  const sum = combo.reduce((a, b) => a + b, 0);
  return sum >= 8 && sum <= 19;
}

/**
 * 检查是否全同路
 * 0路: 0,3,6,9
 * 1路: 1,4,7
 * 2路: 2,5,8
 */
function isSamePath(combo: number[]): boolean {
  const paths = combo.map(num => num % 3);
  return paths[0] === paths[1] && paths[1] === paths[2];
}

/**
 * 第四步：F系滤网斩杀
 */
export function filterCombinations(combinations: number[][]): number[][] {
  return combinations.filter(combo => {
    // F1：杀豹子号
    if (isPair(combo)) return false;

    // F2：和值必须在 8-19 之间
    if (!isValidSum(combo)) return false;

    // F3：不能全同路
    if (isSamePath(combo)) return false;

    return true;
  });
}

/**
 * 完整的精算流程
 */
export function calculateP3(n1: string, n2: string, n3: string): CalculationResult {
  const radarStatus = checkRadar(n1, n2);

  if (radarStatus.isBlocked) {
    return {
      period: '', // 由调用者设置
      n1,
      n2,
      n3,
      radarStatus,
      combinations: [],
      count: 0,
      isDeadlock: false,
    };
  }

  const threeElements = extractThreeElements(n1, n2, n3);

  if (!threeElements) {
    return {
      period: '',
      n1,
      n2,
      n3,
      radarStatus,
      combinations: [],
      count: 0,
      isDeadlock: true,
    };
  }

  const combinations = generateCombinations(threeElements);
  const filtered = filterCombinations(combinations);

  return {
    period: '',
    n1,
    n2,
    n3,
    radarStatus,
    threeElements,
    combinations: filtered,
    count: filtered.length,
    isDeadlock: false,
  };
}

/**
 * 检查是否中奖
 */
export function checkHit(combinations: number[][], actualNumbers: string): boolean {
  const actualDigits = actualNumbers.split('').map(Number).sort((a, b) => a - b);
  return combinations.some(combo => {
    const sorted = [...combo].sort((a, b) => a - b);
    return sorted.join(',') === actualDigits.join(',');
  });
}

/**
 * 计算误杀情况
 * 如果当前期被雷达阻挡，但实际开奖号本应中奖，则记录误杀
 */
export function calculateMissing(
  radarStatus: RadarStatus,
  n1: string,
  n2: string,
  n3: string,
  actualNumbers: string
): string {
  if (!radarStatus.isBlocked) {
    return '-';
  }

  // 假设雷达没有阻挡，计算本应的结果
  const threeElements = extractThreeElements(n1, n2, n3);
  if (!threeElements) {
    return '-'; // 物理死锁，不算误杀
  }

  const combinations = generateCombinations(threeElements);
  const filtered = filterCombinations(combinations);

  if (checkHit(filtered, actualNumbers)) {
    // 本应中奖，但被雷达阻挡了
    return radarStatus.blockReason || '-';
  }

  return '-';
}
