import type { TimelineEvent } from './types';
import { getDispute } from './index';

export interface TrackingAdapter {
  fetchTimeline(slug: string): Promise<TimelineEvent[]>;
}

/**
 * 데이터 파일의 timeline을 그대로 반환한다.
 *
 * 열린국회정보 Open API는 인증키가 필요하고, 설계 시점에 의안 엔드포인트를
 * sample 키로 시험했을 때 Bad Request가 났다. 명세서를 확보하면 같은 인터페이스로
 * AssemblyApiAdapter를 추가한다.
 */
export const staticAdapter: TrackingAdapter = {
  async fetchTimeline(slug: string): Promise<TimelineEvent[]> {
    return getDispute(slug)?.timeline ?? [];
  },
};
