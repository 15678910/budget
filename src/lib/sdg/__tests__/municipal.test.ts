import { getMunicipalSDG, listMunicipalities } from '@/lib/sdg/municipal';

describe('getMunicipalSDG', () => {
  it('강원 춘천시: 진학률 + 재정 매칭', () => {
    const r = getMunicipalSDG('강원', '춘천시');
    expect(r.admissionRate).toBeCloseTo(77.3, 3);
    expect(r.fiscal).not.toBeNull();
    expect(r.fiscal!.independence).toBeCloseTo(28.5, 3);
    expect(r.fiscal!.population).toBe(285000);
    expect(r.availableGoals).toContain(4);
  });

  it('서울 강남구: 진학률 + 재정 매칭', () => {
    const r = getMunicipalSDG('서울', '강남구');
    expect(r.admissionRate).toBeCloseTo(50.5, 3);
    expect(r.fiscal).not.toBeNull();
    expect(r.fiscal!.independence).toBeCloseTo(56.1, 3);
    expect(r.availableGoals).toEqual([4]);
  });

  it('광주전남 광산구: 광주 진학률 매칭', () => {
    const r = getMunicipalSDG('광주전남', '광산구');
    expect(r.admissionRate).not.toBeNull();
    expect(r.fiscal).not.toBeNull();
  });

  it('존재하지 않는 시군구는 null·공백 + 빈 availableGoals', () => {
    const r = getMunicipalSDG('강원', '없는시');
    expect(r.admissionRate).toBeNull();
    expect(r.fiscal).toBeNull();
    expect(r.availableGoals).toEqual([]);
  });

  it('note(고지) 문구를 포함한다', () => {
    const r = getMunicipalSDG('서울', '강남구');
    expect(typeof r.note).toBe('string');
    expect(r.note.length).toBeGreaterThan(0);
  });
});

describe('listMunicipalities', () => {
  it('강원 시군구 목록을 반환한다', () => {
    const list = listMunicipalities('강원');
    expect(list).toContain('춘천시');
    expect(list).toContain('원주시');
    expect(list.length).toBeGreaterThan(5);
  });

  it('광주전남은 광주+전남 시군구를 합쳐 반환한다', () => {
    const list = listMunicipalities('광주전남');
    expect(list).toContain('광산구'); // 광주
    expect(list).toContain('여수시'); // 전남
    expect(list.length).toBeGreaterThan(20);
  });

  it('정렬·중복 제거된 목록', () => {
    const list = listMunicipalities('서울');
    const dedup = [...new Set(list)];
    expect(list.length).toBe(dedup.length);
  });
});
