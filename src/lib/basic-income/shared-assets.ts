/** ⑥b 공유 자산 배당 */
import type { SharedAsset } from './types';

export function sharedAssetFlows(assets: SharedAsset[]): { pay: number; save: number } {
  let pay = 0;
  let save = 0;
  for (const a of assets) {
    const flow = Math.max(0, a.stake) * a.yieldRate;
    if (a.mode === 'pay') pay += flow;
    else save += flow;
  }
  return { pay, save };
}
